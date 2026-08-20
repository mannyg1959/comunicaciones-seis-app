const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/CotizacionForm.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import Navigation
content = content.replace(
  "import { ArrowLeft, Save, Plus, Trash2, FileEdit, FilePlus, User, Package, FileDown, Expand, X, AlertTriangle, ArrowUp, Building2, CreditCard, Phone, Mail, UserPlus, MapPin, Map, MessageSquare, Users, Layers, Search, List } from 'lucide-react';",
  "import { ArrowLeft, Save, Plus, Trash2, FileEdit, FilePlus, User, Package, FileDown, Expand, X, AlertTriangle, ArrowUp, Building2, CreditCard, Phone, Mail, UserPlus, MapPin, Map, MessageSquare, Users, Layers, Search, List, Navigation } from 'lucide-react';"
);

// 2. Nuevo Cliente - Layout
content = content.replace(
`            <div className="input-group">
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
            </div>`,
`            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}>
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
            </div>`
);

content = content.replace(
`            <div className="input-group">
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
            </div>`,
`            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}>
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
            </div>`
);

// 3. Editar Cliente - Layout
content = content.replace(
`            <div className="input-group">
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
            </div>`,
`            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}>
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
            </div>`
);

content = content.replace(
`            <div className="input-group">
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
            </div>`,
`            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}>
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
            </div>`
);

// 4. Update DB Save logic (New Client)
content = content.replace(
`                        contact_email: newClientObj.correo,
                        address: \`\${newClientObj.ciudad}, \${newClientObj.estado}\``,
`                        contact_email: newClientObj.correo,
                        address: \`\${newClientObj.direccion ? newClientObj.direccion + ' | ' : ''}\${newClientObj.ciudad}, \${newClientObj.estado}\``
);

content = content.replace(
`                        correo: data[0].contact_email,
                        ciudad: data[0].address.split(',')[0] || '',
                        estado: data[0].address.split(',')[1] || '',`,
`                        correo: data[0].contact_email,
                        direccion: data[0].address.includes(' | ') ? data[0].address.split(' | ')[0] : '',
                        ciudad: data[0].address.includes(' | ') ? data[0].address.split(' | ')[1].split(',')[0].trim() : data[0].address.split(',')[0].trim(),
                        estado: data[0].address.includes(' | ') ? data[0].address.split(' | ')[1].split(',')[1]?.trim() : data[0].address.split(',')[1]?.trim(),`
);

// 5. Update DB Save logic (Edit Client)
content = content.replace(
`                        contact_email: editClientData.correo,
                        address: \`\${editClientData.ciudad}, \${editClientData.estado}\``,
`                        contact_email: editClientData.correo,
                        address: \`\${editClientData.direccion ? editClientData.direccion + ' | ' : ''}\${editClientData.ciudad}, \${editClientData.estado}\``
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Script completed');
