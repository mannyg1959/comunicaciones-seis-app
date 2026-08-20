import re
import sys

filepath = 'src/components/CotizacionForm.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import Navigation
content = content.replace(
    "import { ArrowLeft, Save, Plus, Trash2, FileEdit, FilePlus, User, Package, FileDown, Expand, X, AlertTriangle, ArrowUp, Building2, CreditCard, Phone, Mail, UserPlus, MapPin, Map, MessageSquare, Users, Layers, Search, List } from 'lucide-react';",
    "import { ArrowLeft, Save, Plus, Trash2, FileEdit, FilePlus, User, Package, FileDown, Expand, X, AlertTriangle, ArrowUp, Building2, CreditCard, Phone, Mail, UserPlus, MapPin, Map, MessageSquare, Users, Layers, Search, List, Navigation } from 'lucide-react';"
)

# 2. Add Dirección to New Client
new_client_correo_block = """            <div className="input-group">
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
            </div>"""

new_client_correo_replacement = """            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}>
              <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
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

              <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
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
            </div>"""

content = content.replace(new_client_correo_block, new_client_correo_replacement)

# 3. Add Dirección to Edit Client
edit_client_correo_block = """            <div className="input-group">
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
            </div>"""

edit_client_correo_replacement = """            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}>
              <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
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

              <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
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
            </div>"""

content = content.replace(edit_client_correo_block, edit_client_correo_replacement)

# 4. DB Save new client
db_new_client_insert = """                        contact_email: newClientObj.correo,
                        address: `${newClientObj.ciudad}, ${newClientObj.estado}`"""

db_new_client_insert_replacement = """                        contact_email: newClientObj.correo,
                        address: `${newClientObj.direccion ? newClientObj.direccion + ' | ' : ''}${newClientObj.ciudad}, ${newClientObj.estado}`"""

content = content.replace(db_new_client_insert, db_new_client_insert_replacement)

db_new_client_state = """                        correo: data[0].contact_email,
                        ciudad: data[0].address.split(',')[0] || '',
                        estado: data[0].address.split(',')[1] || '',"""

db_new_client_state_replacement = """                        correo: data[0].contact_email,
                        direccion: data[0].address.includes(' | ') ? data[0].address.split(' | ')[0] : '',
                        ciudad: data[0].address.includes(' | ') ? data[0].address.split(' | ')[1].split(',')[0].trim() : data[0].address.split(',')[0].trim(),
                        estado: data[0].address.includes(' | ') ? data[0].address.split(' | ')[1].split(',')[1]?.trim() : data[0].address.split(',')[1]?.trim(),"""

content = content.replace(db_new_client_state, db_new_client_state_replacement)

# 5. DB Save edit client
db_edit_client_update = """                        contact_email: editClientData.correo,
                        address: `${editClientData.ciudad}, ${editClientData.estado}`"""

db_edit_client_update_replacement = """                        contact_email: editClientData.correo,
                        address: `${editClientData.direccion ? editClientData.direccion + ' | ' : ''}${editClientData.ciudad}, ${editClientData.estado}`"""

content = content.replace(db_edit_client_update, db_edit_client_update_replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Changes applied!")
