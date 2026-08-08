import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Plus, Trash2, FileEdit, FilePlus, User, Package, FileDown, Expand, X, AlertTriangle, ArrowUp, Building2, CreditCard, Phone, Mail, UserPlus, MapPin, Map, MessageSquare, Users, Layers, Search } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';


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

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === '') return '';
  const cleanValue = String(value).replace(/\D/g, '');
  if (!cleanValue) return '';
  const numberValue = parseFloat(cleanValue) / 100;
  const parts = numberValue.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];
  return `$${integerPart},${decimalPart}`;
};

const formatCurrencyDisplay = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '$0,00';
  const parts = Number(num).toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];
  return `$${integerPart},${decimalPart}`;
};

const parseMaskedValueToNumber = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const clean = String(value).replace(/[$.]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};


export default function CotizacionForm({ initialData, onCancel, onSave, onDelete, user }) {
  const isNew = !initialData;
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
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showDeleteClientConfirmModal, setShowDeleteClientConfirmModal] = useState(false);
  const [showDeleteClientWarningModal, setShowDeleteClientWarningModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showUnsavedConfirmModal, setShowUnsavedConfirmModal] = useState(false);
  const [associatedTransactionsCount, setAssociatedTransactionsCount] = useState({ quotes: 0, workOrders: 0 });
  const [deletingClient, setDeletingClient] = useState(false);
  const [editClientData, setEditClientData] = useState({
    empresa: '',
    contacto: '',
    rif: '',
    telefono: '',
    correo: '',
    ciudad: '',
    estado: '',
    observaciones: ''
  });
  const [clientsList, setClientsList] = useState([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase.from('clients').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          const mapped = data.map(c => ({
            id: c.id,
            empresa: c.name,
            contacto: c.contact_name,
            rif: c.id,
            telefono: c.contact_phone,
            correo: c.contact_email,
            ciudad: c.address ? c.address.split(',')[0] || '' : '',
            estado: c.address ? c.address.split(',')[1] || '' : '',
            observaciones: ''
          }));
          setClientsList(mapped);
        } else {
          const seedData = defaultClientsData.map(c => ({
            name: c.empresa,
            contact_name: c.contacto,
            contact_phone: c.telefono,
            contact_email: c.correo,
            address: `${c.ciudad}, ${c.estado}`
          }));
          const { data: inserted, error: insertErr } = await supabase
            .from('clients')
            .insert(seedData)
            .select();
          if (!insertErr && inserted) {
            const mapped = inserted.map(c => ({
              id: c.id,
              empresa: c.name,
              contacto: c.contact_name,
              rif: c.id,
              telefono: c.contact_phone,
              correo: c.contact_email,
              ciudad: c.address.split(',')[0] || '',
              estado: c.address.split(',')[1] || '',
              observaciones: ''
            }));
            setClientsList(mapped);
          }
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    };
    fetchClients();
  }, []);

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

  const handleTryDeleteClient = async (client) => {
    if (!client || !client.id) {
      alert('No se puede eliminar un cliente temporal sin guardar en la base de datos.');
      return;
    }
    try {
      setDeletingClient(true);
      const { count: quotesCount, error: quotesError } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id);

      if (quotesError) throw quotesError;

      const { count: woCount, error: woError } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id);

      if (woError) throw woError;

      setAssociatedTransactionsCount({ quotes: quotesCount || 0, workOrders: woCount || 0 });
      setClientToDelete(client);

      if ((quotesCount || 0) > 0 || (woCount || 0) > 0) {
        setShowDeleteClientWarningModal(true);
      } else {
        setShowDeleteClientConfirmModal(true);
      }
    } catch (err) {
      console.error('Error checking client transactions:', err);
      alert('Error al verificar transacciones asociadas al cliente: ' + (err.message || ''));
    } finally {
      setDeletingClient(false);
    }
  };

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete || !clientToDelete.id) return;
    try {
      setDeletingClient(true);
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) throw error;

      setClientsList(prev => prev.filter(c => c.id !== clientToDelete.id));
      
      if (formData.cliente === clientToDelete.empresa) {
        setFormData({
          ...formData,
          cliente: '',
          contacto: ''
        });
      }

      setShowDeleteClientConfirmModal(false);
      setClientToDelete(null);
      setCarouselIndex(0);
    } catch (err) {
      console.error('Error deleting client:', err);
      alert('Error al eliminar el cliente: ' + (err.message || ''));
    } finally {
      setDeletingClient(false);
    }
  };

  const hasUnsavedChanges = () => {
    if (!initialData) {
      const hasClient = !!formData.cliente;
      const hasItems = formData.items.length > 0;
      const hasDescription = !!formData.description;
      const hasValidezChanged = formData.fechaValidez !== '15';
      return hasClient || hasItems || hasDescription || hasValidezChanged;
    }
    if (formData.cliente !== initialData.cliente) return true;
    if (formData.contacto !== (initialData.contacto || '')) return true;
    if (formData.fechaValidez !== initialData.fechaValidez) return true;
    if (formData.condicionesPago !== initialData.condicionesPago) return true;
    if (formData.fechaEntrega !== initialData.fechaEntrega) return true;
    if (formData.description !== (initialData.description || '')) return true;
    if (formData.estado !== initialData.estado) return true;
    if (formData.items.length !== (initialData.items || []).length) return true;
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      const origItem = initialData.items[i];
      if (!origItem) return true;
      if (item.lineaNegocio !== origItem.lineaNegocio) return true;
      if (item.descripcion !== origItem.descripcion) return true;
      if (parseFloat(item.cantidad) !== parseFloat(origItem.cantidad)) return true;
      const rawCosto = parseMaskedValueToNumber(item.costoUnitario);
      const origCosto = parseFloat(origItem.costoUnitario) || 0;
      if (rawCosto !== origCosto) return true;
    }
    return false;
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedConfirmModal(true);
    } else {
      onCancel();
    }
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
    
    // Persist to localStorage so OrdenesTrabajo page can read it
    const savedOts = localStorage.getItem('comunicaciones_seis_ots');
    let currentOts = savedOts ? JSON.parse(savedOts) : [];
    currentOts.unshift(nuevaOT);
    localStorage.setItem('comunicaciones_seis_ots', JSON.stringify(currentOts));

    // Initialize logs for this new OT
    const savedLogs = localStorage.getItem('comunicaciones_seis_ot_logs');
    let currentLogs = savedLogs ? JSON.parse(savedLogs) : {};
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    currentLogs[newOtId] = [
      { id: Date.now(), type: 'status', text: 'Orden Creada', date: nowStr, icon: 'FilePlus' }
    ];
    localStorage.setItem('comunicaciones_seis_ot_logs', JSON.stringify(currentLogs));
    
    const pendingStatus = mockOrderStatusData.find(s => s.name === 'Programación');
    if (pendingStatus) pendingStatus.cantidad += 1;

    setShowAlertModal({ show: true, message: `La cotización ha sido convertida exitosamente a la Orden de Trabajo ${newOtId}.` });
  };

  const handleSaveClick = () => {
    // 1. Campos obligatorios de Cabecera
    if (!formData.fechaValidez || String(formData.fechaValidez).trim() === '') {
      setValidationModal({ show: true, message: "El campo 'Validez (Días)' es obligatorio." });
      return;
    }
    if (!formData.cliente || String(formData.cliente).trim() === '') {
      setValidationModal({ show: true, message: "El campo 'Cliente / Empresa' es obligatorio." });
      return;
    }

    // 2. Al menos un ítem
    if (!formData.items || formData.items.length === 0) {
      setValidationModal({ show: true, message: "La cotización debe tener al menos un ítem." });
      return;
    }

    // 3. Campos obligatorios de ítems (Línea de Negocio, Descripción, Cantidad, Costo Unitario)
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.lineaNegocio || String(item.lineaNegocio).trim() === '') {
        setValidationModal({ show: true, message: `La 'Línea de Negocio' en la línea ${i + 1} es obligatoria.` });
        return;
      }
      if (!item.descripcion || String(item.descripcion).trim() === '') {
        setValidationModal({ show: true, message: `La 'Descripción del Trabajo' en la línea ${i + 1} no puede estar vacía.` });
        return;
      }
      const cant = parseFloat(item.cantidad) || 0;
      if (cant <= 0) {
        setValidationModal({ show: true, message: `La 'Cantidad' en la línea ${i + 1} debe ser mayor a 0.` });
        return;
      }
      const rawCosto = parseMaskedValueToNumber(item.costoUnitario);
      if (rawCosto <= 0) {
        setValidationModal({ show: true, message: `El 'Costo Unitario' en la línea ${i + 1} debe ser mayor a $0.00.` });
        return;
      }
    }

    // 4. Campos obligatorios de condiciones / Totales
    if (!formData.fechaEntrega) {
      setValidationModal({ show: true, message: "El campo 'Fecha Estimada de Entrega' es obligatorio." });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let deliveryDate = null;
    if (formData.fechaEntrega) {
      const [year, month, day] = formData.fechaEntrega.split('-');
      deliveryDate = new Date(year, month - 1, day);
      deliveryDate.setHours(0, 0, 0, 0);
    }

    if (!deliveryDate || deliveryDate.getTime() <= today.getTime()) {
      setValidationModal({ 
        show: true, 
        message: "La Fecha Estimada de Entrega debe ser posterior a la fecha actual." 
      });
      return;
    }

    // 5. Validaciones para estado "Rechazada"
    if (formData.estado === 'Rechazada') {
      if (!formData.motivoRechazo || String(formData.motivoRechazo).trim() === '' || !formData.detalleRechazo || String(formData.detalleRechazo).trim() === '') {
        if (initialData?.estado !== 'Rechazada') {
          setShowRechazoModal(true);
          return;
        }
        setValidationModal({ show: true, message: "El 'Motivo' y el 'Detalle' del rechazo son obligatorios para cotizaciones rechazadas." });
        return;
      }
    }

    // Limpiar costoUnitario de formatos de máscara para guardar números en la base de datos
    const cleanItems = formData.items.map(item => {
      const rawCosto = parseMaskedValueToNumber(item.costoUnitario);
      return {
        ...item,
        costoUnitario: rawCosto
      };
    });

    onSave({
      ...formData,
      items: cleanItems,
      _isNew: isNew
    });
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

          const price = formatCurrencyDisplay(parseFloat(item.costoUnitario) || 0);

          tableHTML += `
            <tr class="c8">
              <td class="c1" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c14" style="margin: 0; text-align: center;"><span class="c20">${index + 1}</span></p></td>
              <td class="c3" colspan="1" rowspan="1" style="border: 1px solid #cccccc; white-space: pre-wrap;"><p class="c7" style="margin: 0; white-space: pre-wrap;"><span class="c12" style="white-space: pre-wrap;">${details}</span></p></td>
              <td class="c2" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c14" style="margin: 0; text-align: center;"><span class="c12">${item.cantidad}</span></p></td>
              <td class="c36" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c15" style="margin: 0; text-align: right;"><span class="c12">${price}</span></p></td>
            </tr>
          `;
        });

        const subtotalFormatted = formatCurrencyDisplay(formData.subtotal);
        const taxesFormatted = formatCurrencyDisplay(formData.impuestos);
        const totalFormatted = formatCurrencyDisplay(formData.total);

        tableHTML += `
            <tr class="c8">
              <td class="c4" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c10" style="margin: 0;"></p></td>
              <td class="c37" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c7" style="margin: 0;"><span class="c12">Subtotal</span></p></td>
              <td class="c31" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c10" style="margin: 0;"></p></td>
              <td class="c9" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c15" style="margin: 0; text-align: right;"><span class="c12">${subtotalFormatted}</span></p></td>
            </tr>
            <tr class="c8">
              <td class="c4" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c10" style="margin: 0;"></p></td>
              <td class="c37" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c7" style="margin: 0;"><span class="c12">IVA (16%)</span></p></td>
              <td class="c31" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c10" style="margin: 0;"></p></td>
              <td class="c9" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c15" style="margin: 0; text-align: right;"><span class="c12">${taxesFormatted}</span></p></td>
            </tr>
            <tr class="c8">
              <td class="c17" colspan="3" rowspan="1" style="border: 1px solid #cccccc;"><p class="c28" style="margin: 0; text-align: right;"><span class="c21 c32">TOTAL DE PRESUPUESTO:</span></p></td>
              <td class="c44" colspan="1" rowspan="1" style="border: 1px solid #cccccc;"><p class="c28" style="margin: 0; text-align: right;"><span class="c21 c32">${totalFormatted}</span></p></td>
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
      const costo = parseMaskedValueToNumber(item.costoUnitario);
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
      case 'En Negociación': return 'var(--tertiary-color)';
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
        overflowY: 'auto' 
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
          <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleBackClick}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            {initialData ? <FileEdit size={22} color="var(--primary-color)" /> : <FilePlus size={22} color="var(--primary-color)" />}
            <span>
              {initialData ? `${initialData.id}` : 'Nueva Cotización'}
              {formData.cliente && (
                <span style={{ fontWeight: '700', fontSize: '1.3rem', color: 'var(--text-main)', marginLeft: '0.5rem' }}>
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
                  color: isNew ? 'var(--text-muted)' : 'var(--text-main)',
                  backgroundColor: isNew ? 'var(--surface-color)' : 'var(--surface-hover)',
                  borderColor: 'var(--border-color)',
                  cursor: isNew ? 'not-allowed' : 'pointer',
                  opacity: isNew ? 0.7 : 1
                }}
                value={formData.estado} 
                onChange={e => setFormData({...formData, estado: e.target.value})}
                disabled={isNew}
              >
                <option value="Borrador">Borrador</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Enviada">Enviada</option>
                <option value="En Negociación">En Negociación</option>
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
                    contacto: matched ? matched.contacto : '',
                    clientId: matched ? matched.id : null
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
                type="button"
                onClick={() => setItemToDelete(item.id)}
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
                  <input 
                    type="text" 
                    className="input-control" 
                    value={typeof item.costoUnitario === 'number' ? formatCurrency(item.costoUnitario * 100) : (item.costoUnitario || '')} 
                    onChange={e => {
                      const formatted = formatCurrency(e.target.value);
                      updateItem(item.id, 'costoUnitario', formatted);
                    }} 
                    placeholder="$0.00"
                  />
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
            <strong style={{ fontSize: '1.125rem' }}>{formatCurrencyDisplay(formData.subtotal)}</strong>
          </div>
          <div className="flex-row-between" style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Impuestos (16%)</span>
            <strong style={{ fontSize: '1.125rem' }}>{formatCurrencyDisplay(formData.impuestos)}</strong>
          </div>
          <div className="flex-row-between" style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '500' }}>Total a Pagar</span>
            <strong style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>{formatCurrencyDisplay(formData.total)}</strong>
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

          <div className="input-group">
            <label>Comentarios</label>
            <textarea
              className="input-control"
              placeholder="Agregar algún tipo de instrucción adicional..."
              rows="3"
              value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
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
                  className="btn btn-secondary" 
                  style={{ flex: 1, height: '48px', fontSize: '0.95rem', padding: '0 1.25rem', minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }} 
                  disabled={filteredClients.length === 0}
                  onClick={() => {
                    const selectedClient = filteredClients[carouselIndex];
                    setEditClientData({ ...selectedClient });
                    setShowEditClientModal(true);
                  }}
                >
                  <FileEdit size={16} />
                  <span>Editar</span>
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ 
                    flex: 1, 
                    height: '48px', 
                    fontSize: '0.95rem', 
                    padding: '0 1.25rem', 
                    minWidth: '120px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.4rem',
                    color: 'var(--error-color)',
                    borderColor: 'rgba(239, 68, 68, 0.2)'
                  }} 
                  disabled={filteredClients.length === 0 || deletingClient}
                  onClick={() => {
                    const selectedClient = filteredClients[carouselIndex];
                    handleTryDeleteClient(selectedClient);
                  }}
                >
                  <Trash2 size={16} />
                  <span>Eliminar</span>
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
                        address: `${newClientObj.ciudad}, ${newClientObj.estado}`
                      }])
                      .select();
                    if (error) throw error;
                    if (data && data[0]) {
                      const dbClient = {
                        id: data[0].id,
                        empresa: data[0].name,
                        contacto: data[0].contact_name,
                        rif: data[0].id,
                        telefono: data[0].contact_phone,
                        correo: data[0].contact_email,
                        ciudad: data[0].address.split(',')[0] || '',
                        estado: data[0].address.split(',')[1] || '',
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
            </div>
          </div>
        </div>
      )}

      {showEditClientModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '480px', margin: 0, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
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
                     value={editClientData.rif || ''} 
                     onChange={e => setEditClientData({...editClientData, rif: e.target.value})} 
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
                    value={editClientData.telefono || ''} 
                    onChange={e => setEditClientData({...editClientData, telefono: e.target.value})} 
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
                  value={editClientData.correo || ''} 
                  onChange={e => setEditClientData({...editClientData, correo: e.target.value})} 
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
                    value={editClientData.ciudad || ''} 
                    onChange={e => setEditClientData({...editClientData, ciudad: e.target.value})} 
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
                    value={editClientData.estado || ''} 
                    onChange={e => setEditClientData({...editClientData, estado: e.target.value})} 
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
                  value={editClientData.observaciones || ''} 
                  onChange={e => setEditClientData({...editClientData, observaciones: e.target.value})} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                onClick={() => {
                  const filteredClients = clientsList.filter(client => 
                    client.empresa.toLowerCase().includes(carouselSearch.toLowerCase()) ||
                    client.contacto.toLowerCase().includes(carouselSearch.toLowerCase()) ||
                    client.rif.toLowerCase().includes(carouselSearch.toLowerCase()) ||
                    client.ciudad.toLowerCase().includes(carouselSearch.toLowerCase()) ||
                    client.estado.toLowerCase().includes(carouselSearch.toLowerCase())
                  );
                  const selectedClient = filteredClients[carouselIndex];
                  
                  // Update clientsList matching by original company name
                  setClientsList(prev => prev.map(c => {
                    if (c.empresa === selectedClient.empresa) {
                      return editClientData;
                    }
                    return c;
                  }));

                  // Update form data if editing the currently selected client
                  if (formData.cliente === selectedClient.empresa) {
                    setFormData({
                      ...formData,
                      cliente: editClientData.empresa,
                      contacto: editClientData.contacto
                    });
                  }

                  setShowEditClientModal(false);
                }}
              >
                Guardar Cambios
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

      {showDeleteClientWarningModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 12000, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '440px', margin: 0, textAlign: 'center', border: '1px solid var(--border-color)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                padding: '1rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={36} color="var(--error-color)" />
              </div>
            </div>
            <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '700' }}>No se puede eliminar el cliente</h3>
            <p style={{ marginBottom: '1.75rem', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              El cliente <strong>{clientToDelete?.empresa}</strong> tiene transacciones asociadas en el sistema:
              <br />
              <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>
                {associatedTransactionsCount.quotes > 0 && `• ${associatedTransactionsCount.quotes} Cotización(es)`}
                {associatedTransactionsCount.workOrders > 0 && <><br />{`• ${associatedTransactionsCount.workOrders} Orden(es) de Trabajo`}</>}
              </span>
              <br />
              Debes eliminar o reasignar estas transacciones antes de poder borrar este cliente.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: '600' }} 
              onClick={() => {
                setShowDeleteClientWarningModal(false);
                setClientToDelete(null);
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {showDeleteClientConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 12000, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '440px', margin: 0, textAlign: 'center', border: '1px solid var(--border-color)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                padding: '1rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={36} color="var(--error-color)" />
              </div>
            </div>
            <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '700' }}>Confirmar Eliminación</h3>
            <p style={{ marginBottom: '1.75rem', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              ¿Estás seguro de que deseas eliminar al cliente <strong>{clientToDelete?.empresa}</strong>? 
              <br />Esta acción eliminará el registro permanentemente y no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, height: '48px', fontSize: '0.95rem' }} 
                disabled={deletingClient}
                onClick={() => {
                  setShowDeleteClientConfirmModal(false);
                  setClientToDelete(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, height: '48px', fontSize: '0.95rem', backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)', color: '#ffffff' }} 
                disabled={deletingClient}
                onClick={handleConfirmDeleteClient}
              >
                {deletingClient ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {itemToDelete !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 12000, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center', border: '1px solid var(--border-color)', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                padding: '1rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={36} color="var(--error-color)" />
              </div>
            </div>
            <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '700' }}>¿Eliminar Línea?</h3>
            <p style={{ marginBottom: '1.75rem', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              ¿Estás seguro de que deseas eliminar esta línea de la cotización? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ flex: 1, height: '48px', fontSize: '0.95rem' }} 
                onClick={() => setItemToDelete(null)}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ flex: 1, height: '48px', fontSize: '0.95rem', backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)', color: '#ffffff' }} 
                onClick={() => {
                  removeItem(itemToDelete);
                  setItemToDelete(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnsavedConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 12000, padding: '1rem' }}>
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: 0, textAlign: 'center', border: '1px solid var(--border-color)', padding: '1.75rem' }}>
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
            <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: '700' }}>Cambios sin guardar</h3>
            <p style={{ marginBottom: '1.75rem', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Tienes cambios sin guardar en esta cotización. ¿Estás seguro de que deseas salir? Los cambios se perderán.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ flex: 1, height: '48px', fontSize: '0.95rem' }} 
                onClick={() => setShowUnsavedConfirmModal(false)}
              >
                Seguir Editando
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ flex: 1, height: '48px', fontSize: '0.95rem', backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)', color: '#ffffff' }} 
                onClick={() => {
                  setShowUnsavedConfirmModal(false);
                  onCancel();
                }}
              >
                Salir sin Guardar
              </button>
            </div>
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
