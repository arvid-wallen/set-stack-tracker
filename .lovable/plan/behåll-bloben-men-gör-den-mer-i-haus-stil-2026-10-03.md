# Behåll bloben, men gör den mer i Haus-stil

## Vad som ändras
- Bloben tas tillbaka bakom hälsningen på Hem (den togs bort i förra steget).
- Ny look som smälter in i den ljusa, beiga Haus-stilen:
  - Mjukare, mattare yta (ingen blank plast-glans eller vita reflexprickar).
  - Appens ljusgröna färg, med lite högre ljusstyrka och lägre genomskinlighet så texten alltid läses tydligt.
  - Mindre och lite förskjuten åt höger/upp, så den inte ligger mitt i texten.
  - Lugnare rörelse: långsammare formändring och svävning.
  - Mjuk, suddig kant mot bakgrunden i stället för skarp kontur.
- Sidbytena förblir de snabbare, lätta övergångarna från förra steget (laggfixen behålls).

## Tekniskt
- Återskapa `src/components/motion/Hero3D.tsx`: `MeshDistortMaterial` med `roughness ~0.9`, `metalness 0`, `distort ~0.25`, `speed ~0.8`; mjukare ljus (högre ambient, svagare directional, ingen pointLight-glans); `dpr` max 1.5, `frameloop` pausad när fliken är dold.
- `Index.tsx`: lazy-importera igen, wrapper ca `h-48 w-48`, förskjuten (`left-[60%] top-[40%]`), `opacity-40`, CSS `blur-[2px]`; döljs vid "reducera rörelse".
- Verifiera med skärmdump på 390×844 att texten är läsbar och att bygget är OK.
