import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, FileEdit, FilePlus, User, Package, FileDown } from 'lucide-react';
import { mockCotizaciones, mockOrdenesTrabajo, mockOrderStatusData } from '../data/mockData';

const loadHtml2Pdf = () => {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) {
      resolve(window.html2pdf);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => resolve(window.html2pdf);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const WhatsAppIcon = ({ size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M12.004 2.002c-5.522 0-9.998 4.477-9.998 10 0 2.005.59 3.87 1.6 5.432L2.03 22.008l4.707-1.547a9.92 9.92 0 005.267 1.54c5.52 0 9.998-4.476 9.998-10s-4.478-10-9.998-10zm0 1.777c4.54 0 8.22 3.682 8.22 8.223 0 4.542-3.68 8.223-8.22 8.223a8.16 8.16 0 01-4.323-1.233l-.31-.186-2.87.943.96-2.793-.205-.326a8.17 8.17 0 01-1.252-4.628c0-4.541 3.68-8.223 8.22-8.223zm-3.633 4.29a.9.9 0 00-.655.3c-.225.244-.576.6-.576 1.341 0 .741.538 1.455.613 1.555.075.1.135.18.255.33.376.467.822.868 1.285 1.22.463.353.948.577 1.455.772.433.167.827.158 1.135.112.338-.05.882-.361 1.008-.711.125-.35.125-.65.088-.712-.038-.063-.138-.1-.288-.175-.15-.075-.882-.436-1.02-.486-.135-.05-.237-.075-.337.075-.1.15-.388.487-.476.587-.087.1-.175.113-.325.038a4.11 4.11 0 01-1.21-.747c-.36-.312-.602-.7-.674-.825-.072-.125-.008-.193.067-.268.067-.068.15-.175.225-.262.075-.088.1-.15.15-.25.05-.1.025-.187-.012-.262-.038-.075-.338-.813-.463-1.113-.122-.293-.244-.253-.338-.258-.087-.005-.187-.005-.287-.005z"/>
  </svg>
);

export default function CotizacionForm({ initialData, onCancel, onSave, onDelete, user }) {
  const [formData, setFormData] = useState(initialData || {
    id: `COT-2026-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaValidez: '15',
    cliente: '',
    contacto: '',
    ejecutivo: user?.name || 'Admin',
    estado: 'Borrador',
    items: [],
    subtotal: 0,
    impuestos: 0,
    total: 0,
    condicionesPago: '50% anticipo / 50% contra entrega',
    fechaEntrega: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [activeTab, setActiveTab] = useState('cabecera');
  const [customClients, setCustomClients] = useState([]);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState({ show: false, message: '' });
  const [newClientData, setNewClientData] = useState({
    empresa: '',
    contacto: '',
    rif: '',
    telefono: '',
    correo: ''
  });

  const handleAddClient = () => {
    setShowNewClientModal(true);
  };

  const executeConvertirOT = () => {
    const newOtId = `OT-500${Math.floor(Math.random() * 100) + 6}`;
    const nuevaOT = {
      id: newOtId,
      cotizacionId: formData.id,
      cliente: formData.cliente || 'Sin Cliente',
      tipo: formData.items.length > 0 ? formData.items[0].lineaNegocio : 'Varios',
      estado: 'Pendiente',
      progreso: 0,
      fechaEntrega: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    mockOrdenesTrabajo.unshift(nuevaOT);
    
    const pendingStatus = mockOrderStatusData.find(s => s.name === 'Pendiente');
    if (pendingStatus) pendingStatus.cantidad += 1;

    setShowAlertModal({ show: true, message: `La cotización ha sido convertida exitosamente a la Orden de Trabajo ${newOtId}.` });
  };

  const handleConvertirOTClick = () => {
    if (formData.estado !== 'Aprobada') {
      setShowConfirmModal(true);
    } else {
      executeConvertirOT();
    }
  };

  const handleWhatsAppSend = () => {
    const quoteIdStr = initialData ? `Cotización #${initialData.id}` : 'Nueva Cotización';
    const itemsText = formData.items.map((item, idx) => {
      return `- *Línea ${idx + 1}*: ${item.cantidad}x ${item.lineaNegocio.split('/')[0]} ($${(item.cantidad * item.costoUnitario).toFixed(2)})`;
    }).join('\n');

    const mensaje = `*${quoteIdStr} - Comunicaciones SEIS*\n\n` +
                    `Hola, te comparto los detalles de la cotización:\n\n` +
                    `*Cliente:* ${formData.cliente || 'Por definir'}\n` +
                    `*Total:* $${formData.total.toFixed(2)}\n` +
                    `*Condiciones:* ${formData.condicionesPago}\n` +
                    `*Entrega estimada:* ${formData.fechaEntrega || 'Por definir'}\n\n` +
                    `*Detalle de Líneas:*\n${itemsText || 'Sin ítems registrados'}\n\n` +
                    `Quedamos a sus órdenes.`;
                    
    const mensajeCodificado = encodeURIComponent(mensaje);
    const url = `https://wa.me/?text=${mensajeCodificado}`;
    window.open(url, '_blank');
  };

  const handleGeneratePDF = async () => {
    try {
      const response = await fetch('/PlantillaCotizacion.html');
      if (!response.ok) {
        throw new Error('No se pudo cargar la plantilla de cotización.');
      }
      let htmlText = await response.text();

      const senderAddresses = [
        "Av. Francisco de Miranda, Edif. Centro Seguros Sudamérica, El Rosal, Caracas",
        "Av. Intercomunal Jorge Rodríguez, Sector Las Garzas, Barcelona, Anzoátegui",
        "Av. Francisco de Miranda, Multicentro Empresarial del Este, Chacao, Caracas"
      ];

      const clientAddresses = [
        "Av. Bolívar, Centro Comercial Las Industrias, Valencia, Carabobo",
        "Av. Bella Vista, Edif. Don Matías, Maracaibo, Zulia",
        "Calle 15 entre Carreras 19 y 20, Barquisimeto, Lara",
        "Av. Las Américas, Sector Albarregas, Mérida",
        "Av. Principal de Las Mercedes, Edif. Centro Profesional, Caracas"
      ];

      const getAddress = (list, seed) => {
        let index = 0;
        if (seed) {
          let sum = 0;
          for (let i = 0; i < seed.length; i++) {
            sum += seed.charCodeAt(i);
          }
          index = sum % list.length;
        } else {
          index = Math.floor(Math.random() * list.length);
        }
        return list[index] + ", Venezuela";
      };

      const senderAddr = getAddress(senderAddresses, "Comunicaciones 6");
      const clientAddr = getAddress(clientAddresses, formData.cliente || "Cliente");

      htmlText = htmlText.replace(/\[campo1\]/gi, formData.id || 'N/A');
      htmlText = htmlText.replace(/\[campo2\]/gi, formData.fechaEmision || 'N/A');
      htmlText = htmlText.replace(/\[campo3\]/gi, 'Comunicaciones 6');
      htmlText = htmlText.replace(/\[campo4\]/gi, senderAddr);
      htmlText = htmlText.replace(/\[campo5\]/gi, formData.cliente || 'Sin Cliente');
      htmlText = htmlText.replace(/\[campo6\]/gi, clientAddr);
      htmlText = htmlText.replace(/src="\/logo\.png"/gi, `src="${window.location.origin}/logo.png"`);

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const table = doc.getElementById('items-table');

      if (table) {
        let tableHTML = `
          <thead>
            <tr class="c8">
              <td class="c0" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c14" style="margin: 0; text-align: center;"><span class="c25" style="font-weight: bold; color: white;">REF.</span></p></td>
              <td class="c43" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c7" style="margin: 0;"><span class="c25" style="font-weight: bold; color: white;">DESCRIPCI&Oacute;N</span></p></td>
              <td class="c48" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c14" style="margin: 0; text-align: center;"><span class="c25" style="font-weight: bold; color: white;">UNIDADES</span></p></td>
              <td class="c40" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c15" style="margin: 0; text-align: right;"><span class="c25" style="font-weight: bold; color: white;">PRECIO</span></p></td>
            </tr>
          </thead>
          <tbody>
        `;

        formData.items.forEach((item, index) => {
          let details = item.descripcion || '';
          const specs = [];
          if (item.lineaNegocio === 'Litografía/Digital') {
            if (item.formato) specs.push(`Formato: ${item.formato}`);
            if (item.sustrato) specs.push(`Sustrato: ${item.sustrato}`);
            if (item.tintas) specs.push(`Tintas: ${item.tintas}`);
            if (item.acabados) specs.push(`Acabados: ${item.acabados}`);
          } else if (item.lineaNegocio === 'Lona/Vinil') {
            if (item.dimensiones) specs.push(`Dimensiones: ${item.dimensiones}`);
            if (item.tipoMaterial) specs.push(`Material: ${item.tipoMaterial}`);
            if (item.resolucion) specs.push(`Resolución: ${item.resolucion}`);
            if (item.terminaciones) specs.push(`Terminaciones: ${item.terminaciones}`);
          } else if (item.lineaNegocio === 'Publicidad Estructural') {
            if (item.dimensiones3D) specs.push(`Dim 3D: ${item.dimensiones3D}`);
            if (item.materialesEstructurales) specs.push(`Estructura: ${item.materialesEstructurales}`);
            if (item.iluminacion) specs.push(`Iluminación: ${item.iluminacion}`);
          } else if (item.lineaNegocio === 'Corte y Troquelado') {
            if (item.materialCorte) specs.push(`Material: ${item.materialCorte}`);
            if (item.grosor) specs.push(`Grosor: ${item.grosor}mm`);
            if (item.tipoCorte) specs.push(`Corte: ${item.tipoCorte}`);
            if (item.metraje) specs.push(`Metraje: ${item.metraje}`);
          }

          if (specs.length > 0) {
            details += ` (${specs.join(', ')})`;
          }

          const price = (parseFloat(item.costoUnitario) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          tableHTML += `
            <tr class="c8">
              <td class="c1" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c14" style="margin: 0; text-align: center;"><span class="c20">${index + 1}</span></p></td>
              <td class="c3" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c7" style="margin: 0;"><span class="c12">${details}</span></p></td>
              <td class="c2" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c14" style="margin: 0; text-align: center;"><span class="c12">${item.cantidad}</span></p></td>
              <td class="c36" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c15" style="margin: 0; text-align: right;"><span class="c12">$${price}</span></p></td>
            </tr>
          `;
        });

        const subtotalFormatted = formData.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const taxesFormatted = formData.impuestos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const totalFormatted = formData.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        tableHTML += `
            <tr class="c8">
              <td class="c4" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c10" style="margin: 0;"></p></td>
              <td class="c37" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c7" style="margin: 0;"><span class="c12">Subtotal</span></p></td>
              <td class="c31" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c10" style="margin: 0;"></p></td>
              <td class="c9" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c15" style="margin: 0; text-align: right;"><span class="c12">$${subtotalFormatted}</span></p></td>
            </tr>
            <tr class="c8">
              <td class="c4" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c10" style="margin: 0;"></p></td>
              <td class="c37" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c7" style="margin: 0;"><span class="c12">IVA (16%)</span></p></td>
              <td class="c31" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c10" style="margin: 0;"></p></td>
              <td class="c9" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c15" style="margin: 0; text-align: right;"><span class="c12">$${taxesFormatted}</span></p></td>
            </tr>
            <tr class="c8">
              <td class="c17" colspan="3" rowspan="1" style="border: 1px solid #cccccc;"><p class="c28" style="margin: 0; text-align: right;"><span class="c21 c32">TOTAL DE PRESUPUESTO:</span></p></td>
              <td class="c44" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c28" style="margin: 0; text-align: right;"><span class="c21 c32">$${totalFormatted}</span></p></td>
            </tr>
          </tbody>
        `;

        table.innerHTML = tableHTML;
      }

      const finalHtml = doc.documentElement.outerHTML;
      const html2pdfLib = await loadHtml2Pdf();
      
      const element = document.createElement('div');
      element.innerHTML = finalHtml;
      
      const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `cotizacion_${formData.id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
      };

      await html2pdfLib().set(opt).from(element).save();

    } catch (error) {
      console.error(error);
      alert('Error al generar el PDF: ' + error.message);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items, 
        { 
          id: Date.now(), 
          lineaNegocio: 'Litografía/Digital', 
          descripcion: '', 
          cantidad: 1, 
          costoUnitario: 0, 
          adjuntos: '',
          // Dynamic fields initialized
          formato: '', sustrato: '', tintas: '', acabados: '',
          dimensiones: '', tipoMaterial: '', resolucion: '', terminaciones: '',
          dimensiones3D: '', materialesEstructurales: '', iluminacion: '', instalacion: 'No',
          materialCorte: '', grosor: '', tipoCorte: '', metraje: ''
        }
      ]
    });
  };

  const removeItem = (id) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id)
    });
  };

  const updateItem = (id, field, value) => {
    const newItems = formData.items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setFormData({ ...formData, items: newItems });
  };

  const renderDynamicFields = (item) => {
    switch(item.lineaNegocio) {
      case 'Litografía/Digital':
        return (
          <>
            <div className="input-group">
              <label>Formato / Tamaño</label>
              <input type="text" className="input-control" value={item.formato} onChange={e => updateItem(item.id, 'formato', e.target.value)} placeholder="Ej. Carta, Tabloide" />
            </div>
            <div className="input-group">
              <label>Sustrato</label>
              <input type="text" className="input-control" value={item.sustrato} onChange={e => updateItem(item.id, 'sustrato', e.target.value)} placeholder="Ej. Glasé 300g" />
            </div>
            <div className="input-group">
              <label>Tintas (Tiro/Retiro)</label>
              <input type="text" className="input-control" value={item.tintas} onChange={e => updateItem(item.id, 'tintas', e.target.value)} placeholder="Ej. 4x4, 4x0" />
            </div>
            <div className="input-group">
              <label>Acabados Especiales</label>
              <input type="text" className="input-control" value={item.acabados} onChange={e => updateItem(item.id, 'acabados', e.target.value)} placeholder="Ej. Plastificado mate" />
            </div>
          </>
        );
      case 'Lona/Vinil':
        return (
          <>
            <div className="input-group">
              <label>Dimensiones (Ancho x Alto)</label>
              <input type="text" className="input-control" value={item.dimensiones} onChange={e => updateItem(item.id, 'dimensiones', e.target.value)} placeholder="Ej. 200x150 cm" />
            </div>
            <div className="input-group">
              <label>Tipo de Material</label>
              <select className="input-control" value={item.tipoMaterial} onChange={e => updateItem(item.id, 'tipoMaterial', e.target.value)}>
                <option value="">Seleccione...</option>
                <option value="Banner 13oz">Banner 13oz</option>
                <option value="Vinil Adhesivo">Vinil Adhesivo</option>
                <option value="Microperforado">Microperforado</option>
                <option value="Clear">Clear</option>
              </select>
            </div>
            <div className="input-group">
              <label>Resolución de Impresión</label>
              <select className="input-control" value={item.resolucion} onChange={e => updateItem(item.id, 'resolucion', e.target.value)}>
                <option value="Estándar">Estándar</option>
                <option value="Alta resolución">Alta resolución (fotográfica)</option>
              </select>
            </div>
            <div className="input-group">
              <label>Terminaciones</label>
              <input type="text" className="input-control" value={item.terminaciones} onChange={e => updateItem(item.id, 'terminaciones', e.target.value)} placeholder="Ej. Ojetes, Bolsillos" />
            </div>
          </>
        );
      case 'Publicidad Estructural':
        return (
          <>
            <div className="input-group">
              <label>Dimensiones 3D (AlxAnxProf)</label>
              <input type="text" className="input-control" value={item.dimensiones3D} onChange={e => updateItem(item.id, 'dimensiones3D', e.target.value)} placeholder="Ej. 100x200x20 cm" />
            </div>
            <div className="input-group">
              <label>Materiales Estructurales</label>
              <input type="text" className="input-control" value={item.materialesEstructurales} onChange={e => updateItem(item.id, 'materialesEstructurales', e.target.value)} placeholder="Ej. Hierro, Acrílico" />
            </div>
            <div className="input-group">
              <label>Tipo de Iluminación</label>
              <select className="input-control" value={item.iluminacion} onChange={e => updateItem(item.id, 'iluminacion', e.target.value)}>
                <option value="Ninguna">Ninguna</option>
                <option value="Módulos LED">Módulos LED</option>
                <option value="Tubos">Tubos</option>
                <option value="Retroiluminado">Retroiluminado</option>
              </select>
            </div>
            <div className="input-group">
              <label>Servicio de Instalación</label>
              <select className="input-control" value={item.instalacion} onChange={e => updateItem(item.id, 'instalacion', e.target.value)}>
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>
          </>
        );
      case 'Corte y Troquelado':
        return (
          <>
            <div className="input-group">
              <label>Material a Procesar</label>
              <input type="text" className="input-control" value={item.materialCorte} onChange={e => updateItem(item.id, 'materialCorte', e.target.value)} placeholder="Ej. Acrílico, Cartón" />
            </div>
            <div className="input-group">
              <label>Grosor del Material (mm)</label>
              <input type="number" className="input-control" value={item.grosor} onChange={e => updateItem(item.id, 'grosor', e.target.value)} placeholder="Ej. 3" />
            </div>
            <div className="input-group">
              <label>Tipo de Corte</label>
              <select className="input-control" value={item.tipoCorte} onChange={e => updateItem(item.id, 'tipoCorte', e.target.value)}>
                <option value="">Seleccione...</option>
                <option value="Láser">Láser</option>
                <option value="Router CNC">Router CNC</option>
                <option value="Troquel tradicional">Troquel tradicional</option>
              </select>
            </div>
            <div className="input-group">
              <label>Metraje Lineal / Tiempo Estimado</label>
              <input type="text" className="input-control" value={item.metraje} onChange={e => updateItem(item.id, 'metraje', e.target.value)} placeholder="Ej. 50 metros" />
            </div>
          </>
        );
      default: return null;
    }
  };

  useEffect(() => {
    const subtotal = formData.items.reduce((acc, item) => {
      const cant = parseFloat(item.cantidad) || 0;
      const costo = parseFloat(item.costoUnitario) || 0;
      return acc + (cant * costo);
    }, 0);
    const impuestos = subtotal * 0.16; // 16% IVA example
    const total = subtotal + impuestos;
    
    setFormData(prev => {
      // Prevent unnecessary updates if values are the same
      if (prev.subtotal === subtotal && prev.impuestos === impuestos && prev.total === total) {
        return prev;
      }
      return { ...prev, subtotal, impuestos, total };
    });
  }, [formData.items]);

  const getCotizacionStatusColor = (estado) => {
    switch(estado) {
      case 'Borrador': return 'var(--text-muted)';
      case 'Pendiente': return 'var(--warning-color)';
      case 'Enviada': return 'var(--secondary-color)';
      case 'Aprobada': return 'var(--success-color)';
      case 'Rechazada': return 'var(--error-color)';
      default: return 'var(--border-color)';
    }
  };

  return (
    <div className="page-content" style={{ paddingBottom: '120px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem' }} onClick={onCancel}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ margin: 0, wordBreak: 'break-word', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {initialData ? <FileEdit size={24} color="var(--primary-color)" /> : <FilePlus size={24} color="var(--primary-color)" />}
            <span>
              {initialData ? `${initialData.id}` : 'Nueva Cotización'}
              {formData.cliente && (
                <> - <strong>{formData.cliente}</strong></>
              )}
            </span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {initialData && (
            <button 
              type="button" 
              className="btn" 
              style={{ 
                border: '1px solid var(--error-color)', 
                background: 'transparent', 
                color: 'var(--error-color)', 
                height: '48px', 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '700',
                minWidth: '100px'
              }} 
              onClick={onDelete}
            >
              <Trash2 size={18} />
              <span>Eliminar</span>
            </button>
          )}
          <button 
            type="button" 
            className="btn" 
            style={{ 
              border: '1px solid var(--border-color)', 
              background: 'transparent', 
              color: '#ffffff', 
              height: '48px', 
              flex: 1.2, 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '700',
              minWidth: '130px'
            }} 
            onClick={handleConvertirOTClick}
          >
            <Package size={18} />
            <span>Convertir a OT</span>
          </button>
          <button 
            type="button" 
            className="btn" 
            style={{ 
              background: 'var(--primary-color)', 
              color: '#ffffff', 
              height: '48px', 
              flex: 1.2, 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '700',
              minWidth: '110px'
            }} 
            onClick={() => onSave(formData)}
          >
            <Save size={18} />
            <span>Guardar</span>
          </button>
        </div>
      </div>



      <div style={{ 
        display: 'flex', 
        gap: '0.25rem',
        backgroundColor: '#162238', // Dark grey background container
        border: '1px solid var(--border-color)', // Grey border around tabs
        borderBottom: 'none', // Merge with card border below
        padding: '0.25rem',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        borderBottomLeftRadius: '0px',
        borderBottomRightRadius: '0px',
        marginBottom: '0px' 
      }}>
        {['Cabecera', 'Detalles', 'Totales'].map(tab => {
          const isActive = activeTab === tab.toLowerCase();
          return (
            <button 
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab.toLowerCase())}
              style={{
                padding: '0.65rem 1rem',
                border: 'none',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                background: isActive ? 'var(--primary-color)' : 'transparent',
                color: '#ffffff', // White letters for both active and inactive
                fontWeight: isActive ? '700' : '500',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flex: 1,
                textAlign: 'center',
                opacity: isActive ? 1 : 0.8
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {activeTab === 'cabecera' && (
        <div className="card" style={{ borderTopLeftRadius: '0px', borderTopRightRadius: '0px', marginTop: '0px' }}>
          <div className="input-group">
            <label htmlFor="estado-cotizacion">Estado de la Cotización</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                position: 'absolute', 
                left: '1rem', 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                backgroundColor: getCotizacionStatusColor(formData.estado),
                zIndex: 10
              }}></div>
              <select 
                id="estado-cotizacion"
                className="input-control" 
                style={{ 
                  fontWeight: '700', 
                  paddingLeft: '2.25rem',
                  color: 'var(--text-main)',
                  backgroundColor: '#0a0f1d',
                  borderColor: 'var(--border-color)'
                }}
                value={formData.estado} 
                onChange={e => setFormData({...formData, estado: e.target.value})}
              >
                <option value="Borrador">Borrador</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Enviada">Enviada</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Rechazada">Rechazada</option>
              </select>
            </div>
          </div>
          <div className="flex-row-between" style={{ gap: '1rem' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Fecha de Emisión</label>
              <input type="date" className="input-control" value={formData.fechaEmision} disabled />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Validez (Días)</label>
              <input type="number" className="input-control" value={formData.fechaValidez} onChange={e => setFormData({...formData, fechaValidez: e.target.value})} />
            </div>
          </div>

          <div className="input-group">
            <label>Cliente / Empresa</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                className="input-control" 
                style={{ flex: 1 }}
                value={formData.cliente} 
                onChange={e => setFormData({...formData, cliente: e.target.value})}
              >
                <option value="">Seleccione un cliente...</option>
                {[...new Set([...mockCotizaciones.map(c => c.cliente), 'Bimbo', 'HUBB', ...customClients])].filter((v, i, a) => a.indexOf(v) === i).map(cliente => (
                  <option key={cliente} value={cliente}>{cliente}</option>
                ))}
              </select>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0 1rem', width: 'auto' }}
                onClick={handleAddClient}
                title="Agregar nuevo cliente"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          <div className="input-group">
            <label>Contacto del Cliente</label>
            <input type="text" className="input-control" value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Ejecutivo de Ventas</label>
            <input type="text" className="input-control" value={formData.ejecutivo} disabled />
          </div>
        </div>
      )}

      {activeTab === 'detalles' && (
        <div style={{ marginTop: '0px' }}>
          {formData.items.map((item, index) => (
            <div 
              key={item.id} 
              className="card" 
              style={{ 
                position: 'relative', 
                borderLeft: '4px solid var(--primary-color)',
                ...(index === 0 ? { borderTopLeftRadius: '0px', borderTopRightRadius: '0px', marginTop: '0px' } : {})
              }}
            >
              <button 
                onClick={() => removeItem(item.id)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--error-color)', cursor: 'pointer' }}
              >
                <Trash2 size={24} />
              </button>
              
              <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Línea {index + 1}</h3>
              <hr style={{ border: 'none', borderTop: '1px solid #4b5563', marginBottom: '1.25rem' }} />
              
              <div className="input-group">
                <label>Línea de Negocio</label>
                <select className="input-control" value={item.lineaNegocio} onChange={e => updateItem(item.id, 'lineaNegocio', e.target.value)}>
                  <option value="Litografía/Digital">Litografía / Impresión Digital</option>
                  <option value="Lona/Vinil">Lona / Vinil (Gran Formato)</option>
                  <option value="Publicidad Estructural">Publicidad Estructural</option>
                  <option value="Corte y Troquelado">Corte y Troquelado</option>
                </select>
              </div>

              <div className="input-group">
                <label>Descripción del Trabajo</label>
                <textarea className="input-control" rows="3" value={item.descripcion} onChange={e => updateItem(item.id, 'descripcion', e.target.value)} placeholder="Ej. Aviso luminoso para fachada..." />
              </div>

              <div className="flex-row-between" style={{ gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Cantidad</label>
                  <input type="number" className="input-control" value={item.cantidad} onChange={e => updateItem(item.id, 'cantidad', e.target.value)} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Costo Unitario ($)</label>
                  <input type="number" className="input-control" value={item.costoUnitario} onChange={e => updateItem(item.id, 'costoUnitario', e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label>Archivos Adjuntos (URLs)</label>
                <input type="text" className="input-control" value={item.adjuntos} onChange={e => updateItem(item.id, 'adjuntos', e.target.value)} placeholder="Enlaces a Drive, Dropbox..." />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />
              <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Especificaciones de {item.lineaNegocio.split('/')[0]}</h4>
              
              {renderDynamicFields(item)}
              
            </div>
          ))}

          {formData.items.length === 0 && (
            <div className="card" style={{ borderTopLeftRadius: '0px', borderTopRightRadius: '0px', marginTop: '0px', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No hay ítems agregados en esta cotización.
            </div>
          )}

          <button className="btn btn-secondary" onClick={addItem} style={{ borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--border-color)', background: 'transparent', marginTop: '0.5rem' }}>
            <Plus size={20} /> Añadir Ítem
          </button>
        </div>
      )}

      {activeTab === 'totales' && (
        <div className="card" style={{ borderTopLeftRadius: '0px', borderTopRightRadius: '0px', marginTop: '0px' }}>
          <div className="flex-row-between" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
            <strong style={{ fontSize: '1.125rem' }}>${formData.subtotal.toFixed(2)}</strong>
          </div>
          <div className="flex-row-between" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Impuestos (16%)</span>
            <strong style={{ fontSize: '1.125rem' }}>${formData.impuestos.toFixed(2)}</strong>
          </div>
          <div className="flex-row-between" style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '500' }}>Total a Pagar</span>
            <strong style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>${formData.total.toFixed(2)}</strong>
          </div>
          
          <div className="input-group">
            <label>Fecha Estimada de Entrega</label>
            <input 
              type="date" 
              className="input-control" 
              value={formData.fechaEntrega || ''} 
              onChange={e => setFormData({...formData, fechaEntrega: e.target.value})} 
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="input-group">
            <label>Condiciones de Pago</label>
            <select className="input-control" value={formData.condicionesPago} onChange={e => setFormData({...formData, condicionesPago: e.target.value})}>
              <option value="50% anticipo / 50% contra entrega">50% anticipo / 50% contra entrega</option>
              <option value="100% anticipo">100% anticipo</option>
              <option value="Crédito 15 días">Crédito 15 días</option>
              <option value="Crédito 30 días">Crédito 30 días</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn" 
              style={{ 
                background: 'var(--primary-color)', 
                color: '#ffffff', 
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                fontWeight: '700',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                minWidth: '150px'
              }}
              onClick={handleGeneratePDF}
            >
              <FileDown size={20} />
              Generar PDF
            </button>
            <button 
              type="button" 
              className="btn" 
              style={{ 
                background: '#25D366', 
                color: '#ffffff', 
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                fontWeight: '700',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                minWidth: '180px'
              }}
              onClick={handleWhatsAppSend}
            >
              <WhatsAppIcon size={20} />
              Compartir por WhatsApp
            </button>
          </div>

        </div>
      )}

      {showNewClientModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1rem' }}>Nuevo Cliente</h2>
            <div className="input-group">
              <label>Nombre de la Empresa</label>
              <input type="text" className="input-control" value={newClientData.empresa} onChange={e => setNewClientData({...newClientData, empresa: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Nombre del Contacto</label>
              <input type="text" className="input-control" value={newClientData.contacto} onChange={e => setNewClientData({...newClientData, contacto: e.target.value})} />
            </div>
            <div className="input-group">
              <label>RIF / NIT / RUT</label>
              <input type="text" className="input-control" value={newClientData.rif} onChange={e => setNewClientData({...newClientData, rif: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Número de Teléfono</label>
              <input type="text" className="input-control" value={newClientData.telefono} onChange={e => setNewClientData({...newClientData, telefono: e.target.value})} />
            </div>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label>Correo Electrónico</label>
              <input type="email" className="input-control" value={newClientData.correo} onChange={e => setNewClientData({...newClientData, correo: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem' }} onClick={() => setShowNewClientModal(false)}>Cancelar</button>
              <button className="btn" style={{ flex: 1, padding: '0.75rem' }} onClick={() => {
                if (newClientData.empresa.trim()) {
                  setCustomClients(prev => [...prev, newClientData.empresa.trim()]);
                  setFormData({...formData, cliente: newClientData.empresa.trim(), contacto: newClientData.contacto.trim()});
                  setShowNewClientModal(false);
                  setNewClientData({ empresa: '', contacto: '', rif: '', telefono: '', correo: '' });
                }
              }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Aprobar Cotización</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Debes aprobar la cotización primero. ¿Deseas aprobar la cotización y convertirla a OT ahora?</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem' }} onClick={() => setShowConfirmModal(false)}>Cancelar</button>
              <button className="btn" style={{ flex: 1, padding: '0.75rem', background: 'var(--secondary-color)' }} onClick={() => {
                setShowConfirmModal(false);
                executeConvertirOT();
              }}>Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {showAlertModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--success-color)' }}>¡Éxito!</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>{showAlertModal.message}</p>
            <button className="btn" style={{ width: '100%', padding: '0.75rem' }} onClick={() => {
              setShowAlertModal({ show: false, message: '' });
              onSave({...formData, estado: 'Aprobada', convertidaAOT: true});
            }}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
}
