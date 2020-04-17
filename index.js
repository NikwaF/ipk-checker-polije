const fetch = require('node-fetch');
const cheerio = require('cheerio');
const readline = require('readline-sync');


const getCookie = () => new Promise((resolve,reject) => {
  fetch('https://sim-online.polije.ac.id/', {
    method: 'GET'
  })
  .then(res => resolve(res.headers.raw()['set-cookie']))
});


const login = (nim,pass,random,cookie) => new Promise((resolve, reject) => {
  fetch('https://sim-online.polije.ac.id/client.php', {
    method: 'POST',
    headers: {
     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0",
      "Accept": "*/*",
      "Content-type": "application/x-www-form-urlencoded",
      Origin: "https://sim-online.polije.ac.id",
      Connection: "keep-alive",
      Cookie: cookie     
    },
    body : `user=${nim}&passwd=${pass}&random=${random}`
  })
  .then(res => res.text())
  .then(res => resolve(res))
});

const sendData = (nim,pass,cookie) => new Promise((resolve,reject) => {
  fetch('https://sim-online.polije.ac.id/', {
    method: 'POST',
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookie,
      "Upgrade-Insecure-Requests": 1
    }, 
    body: `data=${nim}%0D%0A&txtEmail=${nim}&txtPassword=${pass}`
  })
  .then(async res => await res.text())
  .then(res => {
    // const $ = cheerio.load(await res.text());
    const $ = cheerio.load(res);
    const nama = $('li.userout>a[href="#"]').text();

    resolve(nama);
  })
});


const getSemester = (thn,sem,cookie,random) => new Promise((resolve,reject) => {
  fetch(`https://sim-online.polije.ac.id/KHS.php?valTahun=${thn}&valSemester=${sem}&sid=${random}`, {
    method: 'GET',
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0",
      Accept:" text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Cookie: cookie,
      "Upgrade-Insecure-Requests": 1
    }
  })
  .then(res => res.text())
  .then(res => {
    const $ = cheerio.load(res);
    const tahunSem = [];
    const tahun = $('#cbSemester option').each((i,e) => {
      if(i < 3){
        tahunSem.push(e.attribs.value);
      } else{ 
        return false;
      }
    });
    resolve(tahunSem);
  })
});


const getIps = (thn,sem,cookie,random) => new Promise((resolve,reject) => {
  fetch(`https://sim-online.polije.ac.id/KHS.php?valTahun=${thn}&valSemester=${sem}&sid=${random}`, {
    method: 'GET',
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0",
      Accept:" text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Cookie: cookie,
      "Upgrade-Insecure-Requests": 1
    }
  })
  .then(res => res.text())
  .then(res => {
    const $ = cheerio.load(res);
    const nilai = $('tr[bgcolor="#0099FF"]>td[colspan="2"]').text().trim();

    resolve(nilai);
  })
});



(async () => {
  const nim = readline.question('NIM  : ').toUpperCase().trim();
  const pass = readline.question('PASS : ',{hideEchoBack: true}).trim();
  const random = Math.random();
  const cookie = await getCookie();
  const cookienya = cookie[0].split(';')[0];
  console.log('[#] login ...');
  const logins = await login(nim,pass,random,cookienya);

  if(logins.trim() === 'salah'){
    console.log(`[#] ${nim} gagal login, password salah`);
    return;
  }

  const dashboard = await sendData(nim,pass,cookie);
  // console.log(cookienya);
  console.log(`[#] ${dashboard}`);
  const arrNim = nim.split('');
  const angkatan = `20${arrNim[3]}${arrNim[4]}`;
  const semester = await getSemester(angkatan,1,cookienya,random);
  let count = 1; 

  for(let i = 0 ; i  < semester.length; i++){
    for(let j=1; j < 3 ; j++){
      let nilai = await getIps(semester[i],j,cookienya,random);
      if(nilai === ''){
        nilai = 'Belum Ada';
      }
      console.log(`[#] IPK Semester ${count} : ${nilai}`);
      count++;
    }
  }

})();