import re
import sys

filepath = 'src/components/CotizacionForm.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. New Client - Empresa & Contacto
empresa_contacto_new = """            <div className="input-group">
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

empresa_contacto_new_repl = """            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}>
              <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
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

              <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
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
            </div>"""

content = content.replace(empresa_contacto_new, empresa_contacto_new_repl)

# 2. Edit Client - Empresa & Contacto
empresa_contacto_edit = """            <div className="input-group">
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

empresa_contacto_edit_repl = """            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}>
              <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
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

              <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
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
            </div>"""

content = content.replace(empresa_contacto_edit, empresa_contacto_edit_repl)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Second patch applied!")
