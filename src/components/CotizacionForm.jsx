import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Plus, Trash2, FileEdit, FilePlus, User, Package, FileDown, Expand, X, AlertTriangle, ArrowUp, Building2, CreditCard, Phone, Mail, UserPlus, MapPin, Map, MessageSquare, Users, Layers, Search } from 'lucide-react';

const defaultClientsData = [
  {
    empresa: 'Bimbo de Venezuela',
    contacto: 'Carlos Mendoza',
    rif: 'J-00012345-6',
    telefono: '+58 212-9912345',
    correo: 'carlos.mendoza@bimbo.com',
    ciudad: 'Caracas',
    estado: 'Miranda',
    observaciones: 'Cliente corporativo regular. Requiere facturación rápida.'
  },
  {
    empresa: 'HUBB Comunicaciones',
    contacto: 'Patricia Silva',
    rif: 'J-31415926-5',
    telefono: '+58 414-2345678',
    correo: 'psilva@hubb.com',
    ciudad: 'Barcelona',
    estado: 'Anzoátegui',
    observaciones: 'Socio comercial para proyectos de gran formato.'
  },
  {
    empresa: 'Empresas Polar',
    contacto: 'Alejandro Rodríguez',
    rif: 'J-00004567-8',
    telefono: '+58 212-2023456',
    correo: 'a.rodriguez@polar.com',
    ciudad: 'Valencia',
    estado: 'Carabobo',
    observaciones: 'Descuento especial de volumen del 10%.'
  },
  {
    empresa: 'Farmatodo',
    contacto: 'María Gabriela Gómez',
    rif: 'J-00078901-2',
    telefono: '+58 412-7894561',
    correo: 'mgomez@farmatodo.com',
    ciudad: 'Chacao',
    estado: 'Caracas',
    observaciones: 'Entregas nocturnas preferidas.'
  }
];
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
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        motivoRechazo: initialData.motivoRechazo || '',
        detalleRechazo: initialData.detalleRechazo || ''
      };
    }
    return {
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
      fechaEntrega: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      motivoRechazo: '',
      detalleRechazo: ''
    };
  });

  const [expandedItem, setExpandedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('cabecera');
  const [customClients, setCustomClients] = useState([]);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [showCarouselModal, setShowCarouselModal] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselSearch, setCarouselSearch] = useState('');
  const [clientsList, setClientsList] = useState(defaultClientsData);
  const [tempMotivoRechazo, setTempMotivoRechazo] = useState('');
  const [tempDetalleRechazo, setTempDetalleRechazo] = useState('');
  const [validationModal, setValidationModal] = useState({ show: false, message: '' });
  const [showAlertModal, setShowAlertModal] = useState({ show: false, message: '' });
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab]);

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  const [newClientData, setNewClientData] = useState({
    empresa: '',
    contacto: '',
    rif: '',
    telefono: '',
    correo: '',
    ciudad: '',
    estado: '',
    observaciones: ''
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
      estado: 'Programación',
      progreso: 0,
      fechaEntrega: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    mockOrdenesTrabajo.unshift(nuevaOT);
    
    const pendingStatus = mockOrderStatusData.find(s => s.name === 'Programación');
    if (pendingStatus) pendingStatus.cantidad += 1;

    setShowAlertModal({ show: true, message: `La cotización ha sido convertida exitosamente a la Orden de Trabajo ${newOtId}.` });
  };

  const handleSaveClick = () => {
    if (formData.total === 0) {
      setValidationModal({ show: true, message: "El total a pagar no puede ser 0 para guardar la cotización." });
      return;
    }
    
    if (formData.estado === 'Rechazada' && initialData?.estado !== 'Rechazada') {
      setShowRechazoModal(true);
      return;
    }
    
    onSave(formData);
  };

  const handleConvertirOTClick = () => {
    if (formData.estado !== 'Aprobada') {
      setShowConfirmModal(true);
    } else {
      executeConvertirOT();
    }
  };

  const handleDeleteClick = () => {
    if (formData.estado !== 'Borrador' && formData.estado !== 'Anulada') {
      setValidationModal({ show: true, message: 'Para poder eliminar esta cotización, primero debes cambiar su estatus a "ANULADA".' });
      return;
    }
    setShowDeleteConfirmModal(true);
  };

  const handleWhatsAppSend = () => {
    if (formData.total === 0) {
      setValidationModal({ show: true, message: "El total a pagar no puede ser 0 para compartir por WhatsApp." });
      return;
    }
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
    if (formData.total === 0) {
      setValidationModal({ show: true, message: "El total a pagar no puede ser 0 para generar el PDF." });
      return;
    }
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

          const price = (parseFloat(item.costoUnitario) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          tableHTML += `
            <tr class="c8">
              <td class="c1" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c14" style="margin: 0; text-align: center;"><span class="c20">${index + 1}</span></p></td>
              <td class="c3" colspan="1" rowspan="1" style="border: 1px solid #cccccc; white-space: pre-wrap;"><p class="c7" style="margin: 0; white-space: pre-wrap;"><span class="c12" style="white-space: pre-wrap;">${details}</span></p></td>
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
          lineaNegocio: 'Impresión', 
          descripcion: '', 
          cantidad: 1, 
          costoUnitario: 0, 
          adjuntos: '',
          // Dynamic fields initialized
          formato: '', sustrato: '', tintas: '', acabados: '',
          dimensiones: '', tipoMaterial: '', resolucion: '', terminaciones: '',
          dimensiones3D: '', materialesEstructurales: '', iluminacion: '', instalacion: 'No',
          materialCorte: '', grosor: '', tipoCorte: '', metraje: '',
          tipoDiseño: '', formatoEntrega: '', complejidad: '',
          tipoInstalacion: '', ubicacion: '', requiereAndamios: 'No', tiempoMontaje: ''
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
      case 'Anulada': return 'var(--text-muted)';
      default: return 'var(--border-color)';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="page-content" 
      style={{ 
        paddingBottom: activeTab === 'detalles' ? '120px' : '0px', 
        overflowY: activeTab === 'detalles' ? 'auto' : 'hidden' 
      }}
    >
      <div style={{
        position: 'sticky',
        top: '-1.5rem',
        zIndex: 100,
        backgroundColor: 'var(--bg-color)',
        margin: '-1.5rem -1.5rem 1.5rem -1.5rem',
        padding: '1.5rem 1.5rem 0.5rem 1.5rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '1rem', 
          flexWrap: 'wrap', 
          marginBottom: '1rem'
        }}>
        {/* Left Side: Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onCancel}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            {initialData ? <FileEdit size={22} color="var(--primary-color)" /> : <FilePlus size={22} color="var(--primary-color)" />}
            <span>
              {initialData ? `${initialData.id}` : 'Nueva Cotización'}
              {formData.cliente && (
                <span style={{ fontWeight: '400', fontSize: '1.1rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  | {formData.cliente}
                </span>
              )}
            </span>
          </h1>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="form-header-actions">
          {initialData && (
            <button 
              type="button" 
              className="btn form-header-btn" 
              style={{ 
                border: '1px solid var(--error-color)', 
                background: 'transparent', 
                color: 'var(--error-color)'
              }} 
              onClick={handleDeleteClick}
            >
              <Trash2 size={16} />
              <span>Eliminar</span>
            </button>
          )}
          {initialData && (
            <button 
              type="button" 
              className="btn btn-secondary form-header-btn" 
              onClick={handleConvertirOTClick}
            >
              <Package size={16} />
              <span>Convertir a OT</span>
            </button>
          )}
          <button 
            type="button" 
            className="btn btn-primary form-header-btn form-header-btn-save" 
            onClick={handleSaveClick}
          >
            <Save size={16} />
            <span>Guardar</span>
          </button>
        </div>
      </div>



      {/* Timeline Stepper */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        backgroundColor: 'var(--surface-color)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        marginBottom: '0',
        position: 'relative',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Background Connector Line */}
        <div style={{
          position: 'absolute',
          top: '38px',
          left: '12%',
          right: '12%',
          height: '2px',
          backgroundColor: '#334155',
          zIndex: 1
        }} />
        
        {/* Active Connector Line Progress */}
        <div style={{
          position: 'absolute',
          top: '38px',
          left: '12%',
          width: `${(activeTab === 'cabecera' ? 0 : activeTab === 'detalles' ? 0.5 : 1) * 76}%`,
          height: '2px',
          backgroundColor: 'var(--primary-color)',
          transition: 'width 0.3s ease',
          zIndex: 2
        }} />

        {[
          { key: 'cabecera', label: 'Cabecera', desc: 'Datos Generales' },
          { key: 'detalles', label: 'Detalles', desc: 'Especificaciones' },
          { key: 'totales', label: 'Totales', desc: 'Resumen y Envío' }
        ].map((step, idx, arr) => {
          const currentIdx = activeTab === 'cabecera' ? 0 : activeTab === 'detalles' ? 1 : 2;
          const isCompleted = idx < currentIdx;
          const isActive = idx === currentIdx;
          
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => setActiveTab(step.key)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '30%',
                zIndex: 3,
                outline: 'none'
              }}
            >
              {/* Step Node */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isCompleted 
                  ? 'var(--success-color)' 
                  : (isActive ? 'var(--primary-color)' : 'var(--bg-color)'),
                border: `2px solid ${isActive ? '#ffffff' : (isCompleted ? 'var(--success-color)' : 'var(--border-color)')}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                transition: 'all 0.3s ease',
                boxShadow: isActive ? '0 0 12px var(--primary-color)' : 'none'
              }}>
                {isCompleted ? '✓' : idx + 1}
              </div>
              
              {/* Step Labels */}
              <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                <span style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  transition: 'color 0.3s ease'
                }}>
                  {step.label}
                </span>
                <span style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                  opacity: 0.8,
                  marginTop: '0.05rem'
                }}>
                  {step.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>

      {activeTab === 'cabecera' && (
        <div className="card">
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
                  fontSize: '1.05rem',
                  paddingLeft: '2.25rem',
                  color: 'var(--text-main)',
                  backgroundColor: 'var(--surface-hover)',
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
                <option value="Anulada">Anulada</option>
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
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select 
                className="input-control" 
                style={{ flex: 1, minWidth: '200px' }}
                value={formData.cliente} 
                onChange={e => {
                  const matched = clientsList.find(c => c.empresa === e.target.value);
                  setFormData({
                    ...formData, 
                    cliente: e.target.value,
                    contacto: matched ? matched.contacto : ''
                  });
                }}
              >
                <option value="">Seleccione un cliente...</option>
                {[...new Set([...clientsList.map(c => c.empresa), ...customClients])].map(cliente => (
                  <option key={cliente} value={cliente}>{cliente}</option>
                ))}
              </select>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0 1rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', height: '48px', fontSize: '0.95rem' }}
                onClick={() => setShowCarouselModal(true)}
                title="Ver Catálogo de Clientes"
              >
                <Users size={20} />
                <span>Ver Clientes</span>
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '0 1.25rem', width: 'auto', height: '48px', fontSize: '0.95rem' }}
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
        <div>
          {formData.items.map((item, index) => (
            <div 
              key={item.id} 
              className="card" 
              style={{ 
                position: 'relative', 
                borderLeft: '4px solid var(--primary-color)'
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
                  <option value="Corte">Corte</option>
                  <option value="Impresión">Impresión</option>
                  <option value="Diseño">Diseño</option>
                  <option value="Instalación">Instalación</option>
                </select>
              </div>

               <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0 }}>Descripción del Trabajo</label>
                  <button 
                    type="button" 
                    onClick={() => setExpandedItem({ id: item.id, index })}
                    style={{ 
                      background: 'var(--primary-color)', 
                      border: 'none', 
                      color: '#ffffff', 
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer', 
                      padding: '0.35rem 0.75rem', 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.825rem',
                      fontWeight: '600',
                      transition: 'background 0.2s, transform 0.1s',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    title="Ampliar descripción"
                  >
                    <Expand size={14} /> Ampliar
                  </button>
                </div>
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


              
            </div>
          ))}

          {formData.items.length === 0 && (
            <div className="card" style={{ borderTopLeftRadius: '0px', borderTopRightRadius: '0px', marginTop: '0px', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No hay ítems agregados en esta cotización.
            </div>
          )}

          <button className="btn btn-secondary" onClick={addItem} style={{ borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--border-color)', background: 'transparent', marginTop: '0.5rem', marginBottom: '100px' }}>
            <Plus size={20} /> Añadir Ítem
          </button>
        </div>
      )}

      {activeTab === 'totales' && (
        <div className="card">
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
              <option value="A convenir con el Cliente">A convenir con el Cliente</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
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

      {showCarouselModal && (() => {
        const filteredClients = clientsList.filter(client => 
          client.empresa.toLowerCase().includes(carouselSearch.toLowerCase()) ||
          client.contacto.toLowerCase().includes(carouselSearch.toLowerCase()) ||
          client.rif.toLowerCase().includes(carouselSearch.toLowerCase()) ||
          client.ciudad.toLowerCase().includes(carouselSearch.toLowerCase()) ||
          client.estado.toLowerCase().includes(carouselSearch.toLowerCase())
        );

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card glass-panel" style={{ width: '100%', maxWidth: '480px', margin: 0, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={22} color="var(--primary-color)" />
                  <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '700' }}>Catálogo de Clientes</h2>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCarouselModal(false);
                    setCarouselSearch('');
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search input field */}
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Buscar por empresa, contacto, RIF o ubicación..." 
                  style={{ paddingLeft: '2.5rem', margin: 0 }}
                  value={carouselSearch}
                  onChange={e => {
                    setCarouselSearch(e.target.value);
                    setCarouselIndex(0);
                  }}
                />
              </div>

              {/* Stack Container */}
              <div style={{ position: 'relative', height: '330px', margin: '0 24px 0 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {filteredClients.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No se encontraron clientes para tu búsqueda.
                  </div>
                ) : (
                  filteredClients.map((client, idx) => {
                    const offset = (idx - carouselIndex + filteredClients.length) % filteredClients.length;
                    
                    // Rotation & Scaling for Stack effect
                    let transformStyle = 'translateX(54px) translateY(24px) scale(0.88) rotate(4.5deg)';
                    let zIndexVal = 0;
                    let opacityVal = 0;
                    let pointerVal = 'none';

                    if (offset === 0) {
                      transformStyle = 'translateX(0) scale(1) rotate(0deg)';
                      zIndexVal = 3;
                      opacityVal = 1;
                      pointerVal = 'auto';
                    } else if (offset === 1) {
                      transformStyle = 'translateX(18px) translateY(8px) scale(0.96) rotate(1.5deg)';
                      zIndexVal = 2;
                      opacityVal = 0.85;
                      pointerVal = 'none';
                    } else if (offset === 2) {
                      transformStyle = 'translateX(36px) translateY(16px) scale(0.92) rotate(3deg)';
                      zIndexVal = 1;
                      opacityVal = 0.6;
                      pointerVal = 'none';
                    }

                    const initials = client.empresa.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                    return (
                      <div 
                        key={client.rif || idx}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'var(--surface-color)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: offset === 0 ? '0 10px 25px -5px rgba(0,0,0,0.3)' : 'none',
                          transform: transformStyle,
                          zIndex: zIndexVal,
                          opacity: opacityVal,
                          pointerEvents: pointerVal,
                          cursor: offset > 0 ? 'pointer' : 'default'
                        }}
                        onClick={() => {
                          if (offset > 0) {
                            setCarouselIndex(idx);
                          }
                        }}
                      >
                        {/* Card Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-full)',
                            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '1.1rem'
                          }}>
                            {initials}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.2' }}>{client.empresa}</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RIF: {client.rif}</span>
                          </div>
                        </div>

                        {/* Columns Info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                          <div>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.725rem' }}>Contacto</span>
                            <strong style={{ color: 'var(--text-main)' }}>{client.contacto}</strong>
                          </div>
                          <div>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.725rem' }}>Teléfono</span>
                            <strong style={{ color: 'var(--text-main)' }}>{client.telefono}</strong>
                          </div>
                          <div>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.725rem' }}>Correo</span>
                            <strong style={{ color: 'var(--text-main)', wordBreak: 'break-all' }}>{client.correo}</strong>
                          </div>
                          <div>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.725rem' }}>Ubicación</span>
                            <strong style={{ color: 'var(--text-main)' }}>{client.ciudad}, {client.estado}</strong>
                          </div>
                        </div>

                        {/* Observations */}
                        <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', fontSize: '0.8rem', borderLeft: '3px solid var(--primary-color)', overflow: 'hidden' }}>
                          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Observaciones</span>
                          <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                            {client.observaciones || 'Sin observaciones registradas.'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {filteredClients.length > 0 ? (
                    <>Cliente <strong>{carouselIndex + 1}</strong> de {filteredClients.length}</>
                  ) : (
                    <>Sin resultados</>
                  )}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                    disabled={filteredClients.length <= 1}
                    onClick={() => setCarouselIndex(prev => (prev - 1 + filteredClients.length) % filteredClients.length)}
                  >
                    ‹
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                    disabled={filteredClients.length <= 1}
                    onClick={() => setCarouselIndex(prev => (prev + 1) % filteredClients.length)}
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ flex: 1, height: '48px', fontSize: '0.95rem', padding: '0 1.25rem', minWidth: '120px' }} 
                  onClick={() => {
                    setShowCarouselModal(false);
                    setCarouselSearch('');
                  }}
                >
                  Cerrar
                </button>
                <button 
                  type="button"
                  className="btn btn-primary" 
                  style={{ flex: 1, height: '48px', fontSize: '0.95rem', padding: '0 1.25rem', minWidth: '120px' }} 
                  disabled={filteredClients.length === 0}
                  onClick={() => {
                    const selectedClient = filteredClients[carouselIndex];
                    setFormData({
                      ...formData,
                      cliente: selectedClient.empresa,
                      contacto: selectedClient.contacto
                    });
                    setShowCarouselModal(false);
                    setCarouselSearch('');
                  }}
                >
                  Seleccionar Cliente
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {showNewClientModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '480px', margin: 0, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
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
            </div>
            
            <div className="input-group">
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
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}>
              <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
                <label>RIF / NIT / RUT <span style={{ color: 'var(--error-color)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <CreditCard size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="Ej. J-12345678-9"
                    style={{ paddingLeft: '2.5rem' }}
                    value={newClientData.rif} 
                    onChange={e => setNewClientData({...newClientData, rif: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
                <label>Número de Teléfono <span style={{ color: 'var(--error-color)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="Ej. +58 412-1234567"
                    style={{ paddingLeft: '2.5rem' }}
                    value={newClientData.telefono} 
                    onChange={e => setNewClientData({...newClientData, telefono: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
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

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0rem' }}>
              <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
                <label>Ciudad <span style={{ color: 'var(--error-color)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="Ej. Caracas"
                    style={{ paddingLeft: '2.5rem' }}
                    value={newClientData.ciudad} 
                    onChange={e => setNewClientData({...newClientData, ciudad: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="input-group" style={{ flex: 1, minWidth: '180px' }}>
                <label>Estado <span style={{ color: 'var(--error-color)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Map size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input-control" 
                    placeholder="Ej. Miranda"
                    style={{ paddingLeft: '2.5rem' }}
                    value={newClientData.estado} 
                    onChange={e => setNewClientData({...newClientData, estado: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label>Observaciones</label>
              <div style={{ position: 'relative' }}>
                <MessageSquare size={16} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
                <textarea 
                  className="input-control" 
                  rows="3"
                  placeholder="Detalles u observaciones adicionales..."
                  style={{ paddingLeft: '2.5rem', paddingTop: '0.75rem' }}
                  value={newClientData.observaciones} 
                  onChange={e => setNewClientData({...newClientData, observaciones: e.target.value})} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                  padding: '0 1.25rem', 
                  minWidth: '120px',
                  opacity: (!newClientData.empresa.trim() || !newClientData.contacto.trim() || !newClientData.rif.trim() || !newClientData.telefono.trim() || !newClientData.correo.trim() || !newClientData.ciudad.trim() || !newClientData.estado.trim()) ? 0.5 : 1
                }} 
                disabled={!newClientData.empresa.trim() || !newClientData.contacto.trim() || !newClientData.rif.trim() || !newClientData.telefono.trim() || !newClientData.correo.trim() || !newClientData.ciudad.trim() || !newClientData.estado.trim()}
                onClick={() => {
                  const newClientObj = { ...newClientData };
                  setClientsList(prev => [...prev, newClientObj]);
                  setCustomClients(prev => [...prev, newClientData.empresa.trim()]);
                  setFormData({...formData, cliente: newClientData.empresa.trim(), contacto: newClientData.contacto.trim()});
                  setShowNewClientModal(false);
                  setNewClientData({ empresa: '', contacto: '', rif: '', telefono: '', correo: '', ciudad: '', estado: '', observaciones: '' });
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Aprobar Cotización</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Para proceder con esta acción, primero debes cambiar el estatus de la cotización a "Aprobada".</p>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={() => setShowConfirmModal(false)}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>¿Eliminar Registro?</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem' }} onClick={() => setShowDeleteConfirmModal(false)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 1, padding: '0.75rem', background: 'var(--error-color)', border: 'none', color: '#fff' }} onClick={() => {
                setShowDeleteConfirmModal(false);
                onDelete();
              }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showRechazoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '450px', margin: 0 }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.25rem' }}>Detalles de Rechazo</h2>
            
            <div className="input-group">
              <label>Motivo del Rechazo</label>
              <select 
                className="input-control" 
                value={tempMotivoRechazo} 
                onChange={e => setTempMotivoRechazo(e.target.value)}
              >
                <option value="">Seleccione una opción...</option>
                <option value="Rechazo Interno">Rechazo Interno</option>
                <option value="Rechazo por Parte del Cliente">Rechazo por Parte del Cliente</option>
                <option value="Rechazo Automático">Rechazo Automático</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label>Causas y Razones (Detalle)</label>
              <textarea 
                className="input-control" 
                rows="4" 
                placeholder="Explica las causas y razones del rechazo..."
                value={tempDetalleRechazo} 
                onChange={e => setTempDetalleRechazo(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.75rem' }} 
                onClick={() => {
                  setShowRechazoModal(false);
                  setTempMotivoRechazo('');
                  setTempDetalleRechazo('');
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.75rem' }} 
                disabled={!tempMotivoRechazo || !tempDetalleRechazo.trim()}
                onClick={() => {
                  const updatedData = {
                    ...formData,
                    motivoRechazo: tempMotivoRechazo,
                    detalleRechazo: tempDetalleRechazo.trim()
                  };
                  setShowRechazoModal(false);
                  onSave(updatedData);
                }}
              >
                Guardar
              </button>
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

      {expandedItem !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="card glass-panel" style={{
            width: '100%',
            maxWidth: '700px',
            margin: 0,
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--primary-color)' }}>
                Descripción del Trabajo (Línea {expandedItem.index + 1})
              </h3>
              <button 
                type="button" 
                onClick={() => setExpandedItem(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <textarea
              className="input-control"
              style={{
                width: '100%',
                height: '350px',
                resize: 'vertical',
                fontSize: '1rem',
                lineHeight: '1.5',
                padding: '1rem'
              }}
              value={formData.items.find(i => i.id === expandedItem.id)?.descripcion || ''}
              onChange={e => updateItem(expandedItem.id, 'descripcion', e.target.value)}
              placeholder="Escribe la descripción detallada aquí..."
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setExpandedItem(null)}
                style={{ width: 'auto', padding: '0.5rem 2rem' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {validationModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 11000, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                padding: '1rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={36} color="var(--warning-color)" />
              </div>
            </div>
            <p style={{ marginBottom: '1.75rem', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>{validationModal.message}</p>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontWeight: '600' }} onClick={() => setValidationModal({ show: false, message: '' })}>
              Entendido
            </button>
          </div>
        </div>
      )}
      {showScrollTop && (
        <button 
          type="button"
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '7.5rem',
            right: '1.5rem',
            backgroundColor: 'var(--primary-color)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            width: '46px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-lg)',
            cursor: 'pointer',
            zIndex: 999,
            transition: 'all 0.3s ease',
            opacity: 0.9
          }}
          title="Regresar al inicio"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
