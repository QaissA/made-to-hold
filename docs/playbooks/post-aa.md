# Playbook: Post-processing & AA (Phases 4–5)

**Canon:** architecture §3.8, §3.9

## Recommended pass order

1. N8AO  
2. SSGI / SSR (`realism-effects`)  
3. Bloom  
4. Depth of Field  
5. TRAA / temporal AA (or SMAA)

Use `@react-three/postprocessing` EffectComposer. **One** output/encoding path — no double tone-map.

## Reflections / transmission

- IBL specular from Environment  
- SSR for screen-space layer  
- Floors: `<MeshReflectorMaterial>`  
- Glass: `MeshPhysicalMaterial.transmission` or drei `MeshTransmissionMaterial`

## Checklist

- [ ] Pass order matches above unless measured reason to change
- [ ] Bloom/DOF tuned against Eevee glare/DoF reference
- [ ] Temporal stability acceptable (TRAA or equivalent)
