from pathlib import Path
p=Path('app/monologue/index.tsx')
lines=p.read_text(encoding='utf-8').splitlines()
new=[]
skip=False
for l in lines:
    if not skip and l.strip().startswith('const PRESET_INSIGHTS'):
        skip=True
        new.append('const PRESET_INSIGHTS = [')
        new.append('  "placeholder",')
        new.append('];')
        continue
    if skip:
        if '];' in l:
            skip=False
        continue
    new.append(l)
p.write_text('\n'.join(new), encoding='utf-8')
print('done')
