# Parity checklist (A/B vs Eevee)

Use the **same** camera, HDRI, exposure, and glTF for both sides. Keep a reference Eevee screenshot in-repo per test scene when assets exist.

## Phase gates

- [ ] **P1 Color** — AgX both sides; texture colorSpaces correct; gray/neutral match
- [ ] **P2 Lights/shadows** — rig match; area-light shadow strategy; mapSize/bias OK
- [ ] **P3 GI/AO** — strategy chosen; N8AO; bounce believable vs Eevee
- [ ] **P4 Reflections/transmission** — SSR/planar/glass acceptable
- [ ] **P5 Post/AA** — bloom/DOF/AA stable
- [ ] **P6 Hero (optional)** — Path C still if needed

## Quick “why off” order

1. Tone mapping / exposure  
2. Texture colorSpace  
3. HDRI identity + rotation  
4. Light intensities  
5. Shadow resolution/bias  
6. Missing GI/AO vs Eevee GI on  
