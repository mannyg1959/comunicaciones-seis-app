import re
import sys

filepath = 'src/components/CotizacionForm.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the entire forms to ensure a clean, professional layout.
# Let's extract the New Client form and Edit Client form completely and replace them.

new_client_start = '            <div style={{ display: \'grid\', gridTemplateColumns: \'1fr 1fr\', gap: \'1rem\', marginBottom: \'0rem\' }}>'
# We have multiple blocks of this in the file. I will use regex to find and replace everything between the start of Empresa and the end of Observaciones.

# Actually, the safest way is to do a regex substitution block by block.

# 1. New Client Form - Restore Full Width for Empresa & Contacto
content = content.replace(
"""            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0rem' }}>
              <div className="input-group" style={{ width: '100%' }}>
                <label>Nombre de la Empresa <span style={{ color: 'var(--error-color)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="Ej. Alimentos Polar, C.A."
                    style={{ paddingLeft: '2.5rem' }}
                    value={newClientData.empresa} 
                    onChange={e => setNewClientData({...newClientData, empresa: e.target.value})} 
                  />
                </div>
              </div>

              <div className="input-group" style={{ width: '100%' }}>
                <label>Nombre del Contacto <span style={{ color: 'var(--error-color)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="Ej. Juan Pérez"
                    style={{ paddingLeft: '2.5rem' }}
                    value={newClientData.contacto} 
                    onChange={e => setNewClientData({...newClientData, contacto: e.target.value})} 
                  />
                </div>
              </div>
            </div>""",
"""            <div className="input-group">
              <label>Nombre de la Empresa <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Ej. Alimentos Polar, C.A."
                  style={{ paddingLeft: '2.5rem' }}
                  value={newClientData.empresa} 
                  onChange={e => setNewClientData({...newClientData, empresa: e.target.value})} 
                />
              </div>
            </div>

            <div className="input-group">
              <label>Nombre del Contacto <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Ej. Juan Pérez"
                  style={{ paddingLeft: '2.5rem' }}
                  value={newClientData.contacto} 
                  onChange={e => setNewClientData({...newClientData, contacto: e.target.value})} 
                />
              </div>
            </div>"""
)

# 2. Edit Client Form - Restore Full Width for Empresa & Contacto
content = content.replace(
"""            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0rem' }}>
              <div className="input-group" style={{ width: '100%' }}>
                <label>Nombre de la Empresa <span style={{ color: 'var(--error-color)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="Ej. Alimentos Polar, C.A."
                    style={{ paddingLeft: '2.5rem' }}
                    value={editClientData.empresa} 
                    onChange={e => setEditClientData({...editClientData, empresa: e.target.value})} 
                  />
                </div>
              </div>

              <div className="input-group" style={{ width: '100%' }}>
                <label>Nombre del Contacto <span style={{ color: 'var(--error-color)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="Ej. Juan Pérez"
                    style={{ paddingLeft: '2.5rem' }}
                    value={editClientData.contacto} 
                    onChange={e => setEditClientData({...editClientData, contacto: e.target.value})} 
                  />
                </div>
              </div>
            </div>""",
"""            <div className="input-group">
              <label>Nombre de la Empresa <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Ej. Alimentos Polar, C.A."
                  style={{ paddingLeft: '2.5rem' }}
                  value={editClientData.empresa} 
                  onChange={e => setEditClientData({...editClientData, empresa: e.target.value})} 
                />
              </div>
            </div>

            <div className="input-group">
              <label>Nombre del Contacto <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Ej. Juan Pérez"
                  style={{ paddingLeft: '2.5rem' }}
                  value={editClientData.contacto} 
                  onChange={e => setEditClientData({...editClientData, contacto: e.target.value})} 
                />
              </div>
            </div>"""
)

# 3. New Client Form - Restore Full Width for Correo & Dirección
content = content.replace(
"""            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0rem' }}>
              <div className="input-group" style={{ width: '100%' }}>
                <label>Correo Electrónico <span style={{ color: 'var(--error-color)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="input-control" 
                    placeholder="Ej. contacto@empresa.com"
                    style={{ paddingLeft: '2.5rem' }}
                    value={newClientData.correo} 
                    onChange={e => setNewClientData({...newClientData, correo: e.target.value})} 
                  />
                </div>
              </div>

              <div className="input-group" style={{ width: '100%' }}>
                <label>Dirección</label>
                <div style={{ position: 'relative' }}>
                  <Navigation size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
                  <textarea 
                    className="input-control" 
                    rows="2"
                    placeholder="Ej. Av. Principal..."
                    style={{ paddingLeft: '2.5rem', paddingTop: '0.75rem', resize: 'vertical' }}
                    value={newClientData.direccion || ''} 
                    onChange={e => setNewClientData({...newClientData, direccion: e.target.value})} 
                  />
                </div>
              </div>
            </div>""",
"""            <div className="input-group">
              <label>Correo Electrónico <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="input-control" 
                  placeholder="Ej. contacto@empresa.com"
                  style={{ paddingLeft: '2.5rem' }}
                  value={newClientData.correo} 
                  onChange={e => setNewClientData({...newClientData, correo: e.target.value})} 
                />
              </div>
            </div>

            <div className="input-group">
              <label>Dirección</label>
              <div style={{ position: 'relative' }}>
                <Navigation size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
                <textarea 
                  className="input-control" 
                  rows="2"
                  placeholder="Ej. Av. Principal..."
                  style={{ paddingLeft: '2.5rem', paddingTop: '0.75rem', resize: 'vertical' }}
                  value={newClientData.direccion || ''} 
                  onChange={e => setNewClientData({...newClientData, direccion: e.target.value})} 
                />
              </div>
            </div>"""
)

# 4. Edit Client Form - Restore Full Width for Correo & Dirección
content = content.replace(
"""            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0rem' }}>
              <div className="input-group" style={{ width: '100%' }}>
                <label>Correo Electrónico <span style={{ color: 'var(--error-color)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="email" 
                    className="input-control" 
                    placeholder="Ej. contacto@empresa.com"
                    style={{ paddingLeft: '2.5rem' }}
                    value={editClientData.correo || ''} 
                    onChange={e => setEditClientData({...editClientData, correo: e.target.value})} 
                  />
                </div>
              </div>

              <div className="input-group" style={{ width: '100%' }}>
                <label>Dirección</label>
                <div style={{ position: 'relative' }}>
                  <Navigation size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
                  <textarea 
                    className="input-control" 
                    rows="2"
                    placeholder="Ej. Av. Principal..."
                    style={{ paddingLeft: '2.5rem', paddingTop: '0.75rem', resize: 'vertical' }}
                    value={editClientData.direccion || ''} 
                    onChange={e => setEditClientData({...editClientData, direccion: e.target.value})} 
                  />
                </div>
              </div>
            </div>""",
"""            <div className="input-group">
              <label>Correo Electrónico <span style={{ color: 'var(--error-color)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="input-control" 
                  placeholder="Ej. contacto@empresa.com"
                  style={{ paddingLeft: '2.5rem' }}
                  value={editClientData.correo || ''} 
                  onChange={e => setEditClientData({...editClientData, correo: e.target.value})} 
                />
              </div>
            </div>

            <div className="input-group">
              <label>Dirección</label>
              <div style={{ position: 'relative' }}>
                <Navigation size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
                <textarea 
                  className="input-control" 
                  rows="2"
                  placeholder="Ej. Av. Principal..."
                  style={{ paddingLeft: '2.5rem', paddingTop: '0.75rem', resize: 'vertical' }}
                  value={editClientData.direccion || ''} 
                  onChange={e => setEditClientData({...editClientData, direccion: e.target.value})} 
                />
              </div>
            </div>"""
)

# 5. Fix grids for RIF / Telefono and Ciudad / Estado to look good
# They were changed to: <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0rem' }}>
# Let's change them back to display: flex with flex-wrap so they adapt well.
content = content.replace(
    "style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0rem' }}",
    "style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}"
)

content = content.replace(
    "className=\"input-group\" style={{ width: '100%' }}",
    "className=\"input-group\" style={{ flex: 1, minWidth: '180px' }}"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Professional layout applied!")
