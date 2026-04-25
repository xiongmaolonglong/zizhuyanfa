#!/usr/bin/env bash
# Prevents writes that exceed 800 lines

input=$(cat)
lines=$(echo "$input" | node -e "
  let d='';
  process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    const i=JSON.parse(d);
    const c=i.tool_input?.content||'';
    console.log(c.split('\n').length);
  })
" <<< "$input")

if [ "$lines" -gt 800 ]; then
  echo "[Hook] BLOCKED: File exceeds 800 lines ($lines lines)" >&2
  echo "[Hook] Split into smaller modules" >&2
  exit 2
fi

echo "$input"
