#!/usr/bin/env python3
# Headless and MCP-safe Blender mesh QA validator for Unity URP export gates.
import argparse
import json
import math
from pathlib import Path
import sys


class _SafeArgumentParser(argparse.ArgumentParser):
    # Raise ValueError instead of SystemExit so live Blender MCP never terminates.
    def exit(self, status=0, message=None):
        raise ValueError(message.strip() if message else f"argument_parser_exit:{status}")

    # Route parse errors through ValueError rather than calling sys.exit(2).
    def error(self, message):
        raise ValueError(f"invalid_arguments: {message}")


def parse_cli_args(argv=None):
    # Slice arguments after '--' so Blender's own CLI flags are ignored.
    raw = list(sys.argv) if argv is None else list(argv)
    script_args = raw[raw.index("--") + 1 :] if "--" in raw else raw[1:]
    parser = _SafeArgumentParser(prog="qa_unity_export.py", add_help=False)
    parser.add_argument("--budget-tris", type=int, default=15000)
    parser.add_argument("--max-materials", type=int, default=1)
    parser.add_argument("--epsilon", type=float, default=1e-4)
    parser.add_argument("--allow-boundaries", action="store_true")
    parser.add_argument("--sidecar", type=str, default="")
    parser.add_argument("--json", action="store_true")
    return parser.parse_args(script_args)


def _extract_rotation_rad(obj):
    # Convert active rotation representation to XYZ radians so quaternion VRM imports are checked.
    mode = getattr(obj, "rotation_mode", "XYZ")
    if mode == "QUATERNION" and hasattr(obj, "rotation_quaternion"):
        quat = obj.rotation_quaternion
        if hasattr(quat, "to_euler"):
            eul = quat.to_euler("XYZ")
            return (float(eul[0]), float(eul[1]), float(eul[2]))
        w, x, y, z = (float(quat[0]), float(quat[1]), float(quat[2]), float(quat[3]))
        angle = 2.0 * math.acos(min(1.0, abs(w)))
        return (angle if abs(x) >= abs(y) and abs(x) >= abs(z) else 0.0, angle if abs(y) > abs(x) else 0.0, angle if abs(z) > max(abs(x), abs(y)) else 0.0)
    if mode == "AXIS_ANGLE" and hasattr(obj, "rotation_axis_angle"):
        angle = float(obj.rotation_axis_angle[0])
        return (angle, 0.0, 0.0)
    eul = obj.rotation_euler
    return (float(eul[0]), float(eul[1]), float(eul[2]))


def _count_tris_and_non_manifold(obj, depsgraph, bmesh_mod, allow_boundaries):
    # Evaluate modifiers via depsgraph when available and inspect topology via BMesh without mode switches.
    eval_obj = obj.evaluated_get(depsgraph) if depsgraph is not None and hasattr(obj, "evaluated_get") else None
    mesh = eval_obj.to_mesh() if eval_obj is not None and hasattr(eval_obj, "to_mesh") else obj.data
    bm = bmesh_mod.new()
    try:
        mesh.calc_loop_triangles()
        tris = len(mesh.loop_triangles)
        bm.from_mesh(mesh)
        non_manifold = sum(
            1
            for edge in bm.edges
            if not (edge.is_manifold or (allow_boundaries and edge.is_boundary))
        )
        return tris, non_manifold
    finally:
        bm.free()
        if eval_obj is not None and hasattr(eval_obj, "to_mesh_clear"):
            eval_obj.to_mesh_clear()


def inspect_scene(budget_tris=15000, max_materials=1, epsilon=1e-4, allow_boundaries=False):
    # Import bpy and bmesh lazily so module import never fails outside a Blender runtime.
    try:
        import bmesh
        import bpy
    except ImportError as exc:
        return {
            "tool": "qa_unity_export",
            "version": "0.1.0",
            "ok": False,
            "error": f"bpy_unavailable: {exc}",
            "violations": [{"code": "BPY_UNAVAILABLE", "message": "Run inside Blender (--background --python)."}],
            "fix": {"run": "blender --background <file.blend> --python scripts/qa_unity_export.py -- --budget-tris 15000 --max-materials 1 --json"},
            "fix_commands": ["blender --background <file.blend> --python scripts/qa_unity_export.py -- --budget-tris 15000 --max-materials 1 --json"],
        }

    blend_raw = getattr(bpy.data, "filepath", "") or ""
    blend_name = Path(blend_raw).name if blend_raw else "<unsaved.blend>"
    depsgraph = bpy.context.evaluated_depsgraph_get() if hasattr(bpy, "context") and hasattr(bpy.context, "evaluated_depsgraph_get") else None
    mesh_objects = sorted((o for o in bpy.data.objects if getattr(o, "type", "") == "MESH"), key=lambda o: o.name)

    unique_materials = set()
    max_object_slots = 0
    empty_slot_objects = []
    unapplied_scale_objects = []
    unapplied_rotation_objects = []
    non_manifold_objects = []
    object_reports = []
    total_tris = 0
    total_non_manifold = 0
    skinned_mesh_count = 0

    for obj in mesh_objects:
        tris, non_manifold = _count_tris_and_non_manifold(obj, depsgraph, bmesh, allow_boundaries)
        total_tris += tris
        total_non_manifold += non_manifold

        slots = list(getattr(obj, "material_slots", []))
        max_object_slots = max(max_object_slots, len(slots))
        mat_names = []
        has_empty_slot = False
        for slot in slots:
            mat = getattr(slot, "material", None)
            if mat is None:
                has_empty_slot = True
            else:
                unique_materials.add(mat.name)
                mat_names.append(mat.name)
        if has_empty_slot:
            empty_slot_objects.append(obj.name)

        has_armature = getattr(getattr(obj, "parent", None), "type", "") == "ARMATURE" or any(
            getattr(mod, "type", "") == "ARMATURE" for mod in getattr(obj, "modifiers", [])
        )
        if has_armature:
            skinned_mesh_count += 1

        scale_vec = tuple(float(v) for v in obj.scale)
        rot_vec = _extract_rotation_rad(obj)
        scale_ok = all(abs(v - 1.0) <= epsilon for v in scale_vec)
        rot_ok = all(abs(v) <= epsilon for v in rot_vec)

        if not scale_ok:
            unapplied_scale_objects.append(obj.name)
        if not rot_ok:
            unapplied_rotation_objects.append(obj.name)
        if non_manifold > 0:
            non_manifold_objects.append(obj.name)

        object_reports.append({
            "name": obj.name,
            "tris": tris,
            "skinned": has_armature,
            "material_slots": len(slots),
            "materials": sorted(set(mat_names)),
            "scale": [round(v, 6) for v in scale_vec],
            "rotation_rad": [round(v, 6) for v in rot_vec],
            "scale_ok": scale_ok,
            "rotation_ok": rot_ok,
            "non_manifold_edges": non_manifold,
        })

    material_count = max(len(unique_materials), max_object_slots)
    violations = []
    fix_commands = []

    def _add_fix(cmd):
        # Preserve deterministic insertion order without duplicate CLI remediation entries.
        if cmd not in fix_commands:
            fix_commands.append(cmd)

    if not mesh_objects:
        violations.append({"code": "NO_MESH_OBJECTS", "message": "Scene contains zero MESH objects."})
    if total_tris > budget_tris:
        violations.append({
            "code": "TRIS_OVER_BUDGET",
            "message": f"total_tris ({total_tris}) exceeds budget_tris ({budget_tris}).",
        })
        _add_fix(f'blender --background "{blend_name}" --python scripts/decimate_to_budget.py -- --budget-tris {budget_tris}')
    if material_count > max_materials or empty_slot_objects:
        violations.append({
            "code": "MATERIALS_OVER_BUDGET",
            "message": f"material_count ({material_count}) exceeds max_materials ({max_materials}) or has empty slots ({empty_slot_objects}).",
        })
        _add_fix(f'blender --background "{blend_name}" --python scripts/merge_vrm_atlas.py -- --max-materials {max_materials}')
    if unapplied_scale_objects or unapplied_rotation_objects:
        violations.append({
            "code": "UNAPPLIED_TRANSFORMS",
            "message": f"Unapplied scale={unapplied_scale_objects}, rotation={unapplied_rotation_objects}.",
        })
        _add_fix(
            f'blender --background "{blend_name}" --python-expr '
            '"import bpy; bpy.ops.object.select_all(action=\'SELECT\'); '
            'bpy.ops.object.transform_apply(location=False, rotation=True, scale=True); '
            'bpy.ops.wm.save_mainfile()"'
        )
    if total_non_manifold > 0:
        violations.append({
            "code": "NON_MANIFOLD_EDGES",
            "message": f"Detected {total_non_manifold} non-manifold edge(s) on {non_manifold_objects}.",
        })
        _add_fix(
            f'blender --background "{blend_name}" --python-expr '
            '"import bpy, bmesh; '
            '[(_:=bmesh.new(), _.from_mesh(o.data), bmesh.ops.remove_doubles(_, verts=_.verts, dist=1e-4), '
            'bmesh.ops.recalc_face_normals(_, faces=_.faces), _.to_mesh(o.data), _.free()) '
            'for o in bpy.data.objects if o.type==\'MESH\']; bpy.ops.wm.save_mainfile()"'
        )

    return {
        "tool": "qa_unity_export",
        "version": "0.1.0",
        "blend_file": blend_name,
        "ok": len(violations) == 0,
        "budgets": {
            "budget_tris": budget_tris,
            "max_materials": max_materials,
            "epsilon": epsilon,
            "allow_boundaries": allow_boundaries,
        },
        "summary": {
            "mesh_count": len(mesh_objects),
            "skinned_mesh_count": skinned_mesh_count,
            "total_tris": total_tris,
            "material_count": material_count,
            "unique_materials": sorted(unique_materials),
            "non_manifold_edges": total_non_manifold,
        },
        "objects": object_reports,
        "violations": violations,
        "fix": {"run": fix_commands[0] if fix_commands else None},
        "fix_commands": fix_commands,
    }


def main(argv=None):
    # Parse flags safely, write optional sidecar JSON, and emit deterministic output without sys.exit.
    try:
        args = parse_cli_args(argv)
    except ValueError as exc:
        err_payload = {
            "tool": "qa_unity_export",
            "version": "0.1.0",
            "ok": False,
            "error": str(exc),
            "fix": {"run": None},
            "fix_commands": [],
        }
        sys.stdout.write(json.dumps(err_payload, indent=2) + "\n")
        return err_payload

    report = inspect_scene(
        budget_tris=args.budget_tris,
        max_materials=args.max_materials,
        epsilon=args.epsilon,
        allow_boundaries=args.allow_boundaries,
    )
    rendered = json.dumps(report, indent=2)
    if args.sidecar:
        Path(args.sidecar).write_text(rendered + "\n", encoding="utf-8")
    if args.json:
        sys.stdout.write(rendered + "\n")
    else:
        status = "PASS" if report["ok"] else "FAIL"
        summary = report.get("summary", {})
        sys.stdout.write(
            f"[qa_unity_export] {status} | meshes={summary.get('mesh_count', 0)} "
            f"tris={summary.get('total_tris', 0)}/{args.budget_tris} "
            f"materials={summary.get('material_count', 0)}/{args.max_materials} "
            f"non_manifold={summary.get('non_manifold_edges', 0)}\n"
        )
    sys.stdout.flush()
    return report


if __name__ == "__main__":
    main()
