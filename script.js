async function loadConfig() {
  const response = await fetch('data/config.json');
  return response.json();
}

let config = {};
const pigmentSelect = document.getElementById('pigmentSelect');
const strumentoSelect = document.getElementById('strumentoSelect');
const spettroSelect = document.getElementById('spettroSelect');
const plotDiv = document.getElementById('plot');

loadConfig().then(cfg => {
  config = cfg;
  Object.keys(config).forEach(p => {
    const opt = document.createElement('option');
    opt.value = opt.textContent = p;
    pigmentSelect.appendChild(opt);
  });
  populateStrumenti();
});

pigmentSelect.addEventListener('change', populateStrumenti);
strumentoSelect.addEventListener('change', populateSpettri);

function populateStrumenti() {
  strumentoSelect.innerHTML = "";
  spettroSelect.innerHTML = "";
  const strumenti = Object.keys(config[pigmentSelect.value]);
  strumenti.forEach(s => {
    const opt = document.createElement('option');
    opt.value = opt.textContent = s;
    strumentoSelect.appendChild(opt);
  });
  populateSpettri();
}

function populateSpettri() {
  spettroSelect.innerHTML = "";
  if (!strumentoSelect.value) return;
  config[pigmentSelect.value][strumentoSelect.value].forEach(file => {
    const opt = document.createElement('option');
    opt.value = opt.textContent = file;
    spettroSelect.appendChild(opt);
  });
}

document.getElementById('plotBtn').addEventListener('click', async () => {
  const pigment = pigmentSelect.value;
  const strumento = strumentoSelect.value;
  const file = spettroSelect.value;
  const path = `data/${pigment}/${strumento}/${file}`;

  const response = await fetch(path);
  const text = await response.text();

  // 1️⃣ Trova l'inizio dei dati
  const startIndex = text.indexOf('>>>>>Begin Spectral Data<<<<<');
  if (startIndex === -1) {
    alert('Formato file non riconosciuto!');
    return;
  }

  // 2️⃣ Prendi solo la parte numerica dopo la riga dei dati
  const dataSection = text
    .slice(startIndex)
    .split('\n')
    .slice(1) // salta la riga ">>>>>Begin Spectral Data<<<<<"
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const x = [], y = [];

  // 3️⃣ Converte ogni riga in numeri decimali, sostituendo virgole con punti
  dataSection.forEach(line => {
    const cleaned = line.replace(',', '.').replace('\t', ' ').replace(/\s+/g, ' ');
    const [aStr, bStr] = cleaned.split(' ');
    const a = parseFloat(aStr);
    const b = parseFloat(bStr);
    if (!isNaN(a) && !isNaN(b)) {
      x.push(a);
      y.push(b);
    }
  });

  // 4️⃣ Plot interattivo
  Plotly.newPlot(plotDiv, [{
    x: x,
    y: y,
    mode: 'lines',
    name: file
  }], {
    title: `${pigment} - ${strumento}`,
    xaxis: { title: 'Wavelength (nm)', autorange: true },
    yaxis: { title: 'Intensity', autorange: true }
  });
});

