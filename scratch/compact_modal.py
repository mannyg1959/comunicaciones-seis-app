import re

filepath = 'src/components/CotizacionForm.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Compact input-group classes by adding style={{ marginBottom: '0.75rem' }} where it's not set
content = content.replace(
    'className="input-group">',
    'className="input-group" style={{ marginBottom: \'0.75rem\' }}>'
)
# For the ones that already have a style, we need to modify them.
content = content.replace(
    'className="input-group" style={{ marginBottom: \'1.5rem\' }}>',
    'className="input-group" style={{ marginBottom: \'0.75rem\' }}>'
)
# For the grouped grids that have gap: 1rem, we can reduce gap to 0.5rem
content = content.replace(
    "style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}",
    "style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0rem' }}"
)

# 2. Extract and Move Buttons for Nuevo Cliente
# The buttons are currently at the bottom:
new_client_buttons = """            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ flex: 1, height: '48px', fontSize: '0.95rem', padding: '0 1.25rem', minWidth: '120px' }} 
                onClick={() => {
                  setShowNewClientModal(false);
                  setNewClientData({ empresa: '', contacto: '', rif: '', telefono: '', correo: '', ciudad: '', estado: '', observaciones: '' });
                }}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ 
                  flex: 1, 
                  height: '48px', 
                  fontSize: '0.95rem', 
                  opacity: (!newClientData.empresa.trim() || !newClientData.contacto.trim() || !newClientData.rif.trim() || !newClientData.telefono.trim() || !newClientData.correo.trim() || !newClientData.ciudad.trim() || !newClientData.estado.trim()) ? 0.5 : 1
                }} 
                disabled={!newClientData.empresa.trim() || !newClientData.contacto.trim() || !newClientData.rif.trim() || !newClientData.telefono.trim() || !newClientData.correo.trim() || !newClientData.ciudad.trim() || !newClientData.estado.trim()}
                onClick={async () => {
                  const newClientObj = { ...newClientData };
                  try {
                    const { data, error } = await supabase
                      .from('clients')
                      .insert([{
                        name: newClientObj.empresa,
                        contact_name: newClientObj.contacto,
                        contact_phone: newClientObj.telefono,
                        contact_email: newClientObj.correo,
                        address: `${newClientObj.direccion ? newClientObj.direccion + ' | ' : ''}${newClientObj.ciudad}, ${newClientObj.estado}`
                      }])
                      .select();
                    if (error) throw error;
                    if (data && data[0]) {
                      const fullAddr = data[0].address || '';
                      const dirParts = fullAddr.split(' | ');
                      const locationParts = (dirParts.length > 1 ? dirParts[1] : dirParts[0]).split(', ');
                      
                      const dbClient = {
                        id: data[0].id,
                        empresa: data[0].name,
                        contacto: data[0].contact_name,
                        rif: data[0].id,
                        telefono: data[0].contact_phone,
                        correo: data[0].contact_email,
                        direccion: dirParts.length > 1 ? dirParts[0] : '',
                        ciudad: locationParts[0] || '',
                        estado: locationParts[1] || '',
                        observaciones: ''
                      };
                      setClientsList(prev => [...prev, dbClient]);
                      setCustomClients(prev => [...prev, dbClient.empresa]);
                      setFormData({
                        ...formData,
                        cliente: dbClient.empresa,
                        contacto: dbClient.contacto,
                        clientId: dbClient.id
                      });
                    }
                  } catch (err) {
                    console.error('Error saving client:', err);
                  }
                  setShowNewClientModal(false);
                  setNewClientData({ empresa: '', contacto: '', rif: '', telefono: '', correo: '', ciudad: '', estado: '', observaciones: '' });
                }}

              >
                Guardar
              </button>
            </div>"""

new_client_header = """            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={22} color="var(--primary-color)" />
                <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '700' }}>Nuevo Cliente</h2>
              </div>
              <button 
                type="button" 
                onClick={() => setShowNewClientModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>"""

new_client_buttons_modified = new_client_buttons.replace("marginBottom: '1.5rem'", "marginBottom: '1rem'")

# Delete buttons from bottom
content = content.replace(new_client_buttons, "")

# Add buttons below header
content = content.replace(
    new_client_header,
    new_client_header + "\n\n" + new_client_buttons + "\n" + '            <hr style={{ border: \'none\', borderBottom: \'1px solid var(--border-color)\', margin: \'1rem 0\' }} />'
)

# 3. Extract and Move Buttons for Edit Cliente
edit_client_buttons = """            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ flex: 1, height: '48px', fontSize: '0.95rem', padding: '0 1.25rem', minWidth: '120px' }} 
                onClick={() => {
                  setShowEditClientModal(false);
                }}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ 
                  flex: 1, 
                  height: '48px', 
                  fontSize: '0.95rem', 
                  padding: '0 1.25rem', 
                  minWidth: '120px',
                  opacity: (!editClientData.empresa.trim() || !editClientData.contacto.trim() || !editClientData.rif.trim() || !editClientData.telefono.trim() || !editClientData.correo.trim() || !editClientData.ciudad.trim() || !editClientData.estado.trim()) ? 0.5 : 1
                }} 
                disabled={!editClientData.empresa.trim() || !editClientData.contacto.trim() || !editClientData.rif.trim() || !editClientData.telefono.trim() || !editClientData.correo.trim() || !editClientData.ciudad.trim() || !editClientData.estado.trim()}
                onClick={async () => {
                  try {
                    const { error } = await supabase
                      .from('clients')
                      .update({
                        name: editClientData.empresa,
                        contact_name: editClientData.contacto,
                        contact_phone: editClientData.telefono,
                        contact_email: editClientData.correo,
                        address: `${editClientData.direccion ? editClientData.direccion + ' | ' : ''}${editClientData.ciudad}, ${editClientData.estado}`
                      })
                      .eq('id', editClientData.id);
                    if (error) throw error;

                    setClientsList(prev => prev.map(c => c.id === editClientData.id ? {
                      ...c,
                      empresa: editClientData.empresa,
                      contacto: editClientData.contacto,
                      rif: editClientData.rif,
                      telefono: editClientData.telefono,
                      correo: editClientData.correo,
                      ciudad: editClientData.ciudad,
                      estado: editClientData.estado,
                      direccion: editClientData.direccion,
                      observaciones: editClientData.observaciones
                    } : c));
                  } catch (err) {
                    console.error('Error updating client:', err);
                  }
                  setShowEditClientModal(false);
                }}
              >
                Guardar
              </button>
            </div>"""

edit_client_header = """            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileEdit size={22} color="var(--primary-color)" />
                <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '700' }}>Editar Cliente</h2>
              </div>
              <button 
                type="button" 
                onClick={() => setShowEditClientModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>"""

# Delete buttons from bottom
content = content.replace(edit_client_buttons, "")

# Add buttons below header
content = content.replace(
    edit_client_header,
    edit_client_header + "\n\n" + edit_client_buttons + "\n" + '            <hr style={{ border: \'none\', borderBottom: \'1px solid var(--border-color)\', margin: \'1rem 0\' }} />'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Compacted and moved buttons!")
