import re
import sys

filepath = 'src/components/CotizacionForm.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace flexWrap container with Grid container
content = content.replace(
    "style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}",
    "style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0rem' }}"
)

# Remove flex and minWidth from inner input-groups
content = content.replace(
    "className=\"input-group\" style={{ flex: 1, minWidth: '180px' }}",
    "className=\"input-group\" style={{ width: '100%' }}"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Grid layout applied!")
