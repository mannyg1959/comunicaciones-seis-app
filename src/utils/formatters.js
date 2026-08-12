export const formatDate = (dateString) => {
  if (!dateString || dateString === 'Sin fecha' || dateString === 'N/D') return dateString;
  
  // If it's a simple YYYY-MM-DD string with no time, parse it manually to avoid timezone shifts
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y.slice(-2)}`;
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; 
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

export const formatDateTime = (dateString) => {
  if (!dateString || dateString === 'Sin fecha' || dateString === 'N/D') return dateString;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = String(hours).padStart(2, '0');
  
  return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
};
