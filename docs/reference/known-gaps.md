# Known gaps & mitigations

**Canon:** architecture §5

| Gap | Severity | Mitigation |
|---|---|---|
| RectAreaLight casts no shadows | 🔴 | Shadow proxy light, AccumulativeShadows, or bake |
| Off-screen multi-bounce GI | 🟡 | Environment + SSGI + lightmaps; or Path C for stills |
| No true SSS | 🔴 | Thickness/attenuation fake; custom shader; bake for hero organics |
| No Watt units (WebGL) | 🟡 | Conversion table; or Path B physical units |

None block high-fidelity results if mitigations are applied deliberately.
