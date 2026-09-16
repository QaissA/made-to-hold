# Playbook: Color foundation (Phase 1)

**Goal:** Neutral/gray scenes match Blender Eevee (AgX) before any fancy GI.

**Canon:** `docs/architecture/eevee-parity.md` §3.1, §4

## Checklist

- [ ] `renderer.toneMapping = THREE.AgXToneMapping` (Blender 4.x default)
- [ ] `renderer.outputColorSpace = THREE.SRGBColorSpace`
- [ ] `renderer.toneMappingExposure` matched to Blender exposure / world strength
- [ ] Color textures (baseColor, emissive): `texture.colorSpace = SRGBColorSpace`
- [ ] Data textures (normal, roughness, metalness, AO): linear (`NoColorSpace`)
- [ ] Same HDRI file as Blender; same rotation
- [ ] No double gamma in post (single OutputPass / composer encoding)
- [ ] A/B one glTF + gray reference against Eevee screenshot — **stop until this matches**

## Canvas baseline

```jsx
<Canvas
  gl={{
    toneMapping: THREE.AgXToneMapping,
    toneMappingExposure: 1.0,
    outputColorSpace: THREE.SRGBColorSpace,
    antialias: true,
  }}
  shadows="soft"
  dpr={[1, 2]}
>
```

## Failures that look like “wrong engine”

| Symptom | Likely cause |
|---|---|
| Washed / crunchy contrast vs Blender | Tone mapping mismatch (not AgX) |
| Flat / desaturated albedo | Color texture marked linear |
| Crushed normals / weird roughness | Data texture marked sRGB |
| Shadows pure black | Env intensity / missing fill (see GI playbook) |
