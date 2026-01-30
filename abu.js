const TelegramBot = require("node-telegram-bot-api");
const os = require("os");
const fs = require("fs");
const chalk = require("chalk");
const axios = require("axios");
const figlet = require("figlet");
const settings = require('./settings');
const DB_PATH = "./database";
const TOKEN = settings.TOKEN;
const ADMIN_LINK = settings.ADMIN_LINK;
const CHANNEL_LINK = settings.CHANNEL_LINK;
const runtimeIntervals = {};
const OWNER_ID = settings.OWNER_ID; // GANTI ID TELEGRAM KAMU

// ================= CONFIG =================
const bot = new TelegramBot(TOKEN, { polling: true });

const startTime = Date.now();

// ================= FILE DATABASE =================
if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);

if (!fs.existsSync(`${DB_PATH}/users.json`))
  fs.writeFileSync(`${DB_PATH}/users.json`, "[]");

if (!fs.existsSync(`${DB_PATH}/transaksi.json`))
  fs.writeFileSync(`${DB_PATH}/transaksi.json`, "[]");

// Database untuk akun produk
const DATA_PATH = "./data";
if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH);

if (!fs.existsSync(`${DATA_PATH}/dataam.json`))
  fs.writeFileSync(`${DATA_PATH}/dataam.json`, "[]");


// ================= SESSION =================
let session = {};
let pendingOrder = {};

// ================= PRODUK =================
const produkList = {
  alightmotion: {
    id: 1,
    nama: "Alight Motion Private",
    harga: 3500,
    stok: 10,
    desk: `
━━━━━━━━━━━━━
ᯤ Deskripsi :
> Expired 1 Tahun Full ✅
> Performa Tinggi ✅
> Aktif 24 Jam ✅
> Legal ✅
> Bisa Menggunakan Fitur Premium ✅
`
  },
   panelunli: {
    id: 2,
    nama: "Panel Unli Private",
    harga: 1000,
    stok: 1,
    desk: `
━━━━━━━━━━━━━
ᯤ Deskripsi :
> Expired 1 Tahun Full ✅
> Performa Tinggi ✅
> Aktif 24 Jam ✅
> Legal ✅
> Bisa Menggunakan Fitur Premium ✅
`
  }
};


// ================= FUNCTION TAMPILAN DI TERMINAL =================\
const TERMINAL_WIDTH = process.stdout.columns || 80;

function horizontalLine(width, char) {
    return char.repeat(width);
}

async function getServerSpecs() {
    const totalMemory = (os.totalmem() / 1024 / 1024).toFixed(0) + " MB";
    const usedMemory = ((os.totalmem() - os.freemem()) / 1024 / 1024).toFixed(0) + " MB";

    const uptime = getRuntime();

    let publicIp = "Unknown";
    try {
        const res = await axios.get("https://api.ipify.org?format=json");
        publicIp = res.data.ip;
    } catch {}

    return {
        totalMemory,
        usedMemory,
        uptime,
        publicIp
    };
}

async function showBotInfo() {

    const specs = await getServerSpecs();

    console.log(`\n${chalk.cyan(horizontalLine(TERMINAL_WIDTH, "="))}`);

    try {
        console.log(
            chalk.cyan(
                figlet.textSync("BOT ABU", {
                    horizontalLayout: "default"
                })
            )
        );
    } catch {
        console.log(chalk.cyan.bold("\n BOT ABU\n"));
    }

    console.log(chalk.cyan(horizontalLine(TERMINAL_WIDTH, "=")));

    console.log(`\n${chalk.yellow.bold("◧ Bot Information:")}`);
    console.log(`${chalk.green("Version      :")} 1.0.0`);
    console.log(`${chalk.green("Author       :")} AbuZy Creative`);
    console.log(`${chalk.green("GitHub       :")} github.com/PrabuSA192`);
    console.log(`${chalk.green("Telegram     :")} t.me/abuzycreative`);
    console.log(`${chalk.green("Memory       :")} ${specs.usedMemory} / ${specs.totalMemory}`);
    console.log(`${chalk.green("Uptime       :")} ${specs.uptime}`);
    console.log(`${chalk.green("Public IP    :")} ${specs.publicIp}`);

    console.log(`\n${chalk.cyan(horizontalLine(TERMINAL_WIDTH, "="))}`);
    console.log(chalk.cyan.bold(" ◧ Bot is running successfully! ◧ "));
    console.log(`${chalk.cyan(horizontalLine(TERMINAL_WIDTH, "="))}\n`);
}

(async () => {

    await showBotInfo();

    bot.on('polling_error', (err) => {
        console.log(chalk.red("[AbuZy Creative]: Waduh gagal konek bre lu ubah kode nya ya?"));
        console.error(err);
    });

    bot.getMe()
        .then(() => {
            console.log(chalk.green("[AbuZy Creative]: Bot Dah Aktif Bro sung gaasss"));
        })
        .catch(() => {
            console.log(chalk.red("[AbuZy Creative]: Waduh gagal konek bre lu ubah kode nya ya?"));
        });

})();


// ================= FUNCTION DATABASE =================

function getUsers() {
  return JSON.parse(fs.readFileSync(`${DB_PATH}/users.json`));
}

function saveUser(userId) {
  let users = getUsers();
  if (!users.includes(userId)) {
    users.push(userId);
    fs.writeFileSync(`${DB_PATH}/users.json`, JSON.stringify(users, null, 2));
  }
  return users.length;
}

function getTransaksi() {
  return JSON.parse(fs.readFileSync(`${DB_PATH}/transaksi.json`));
}

function addTransaksi(data) {
  let trx = getTransaksi();
  trx.push(data);
  fs.writeFileSync(`${DB_PATH}/transaksi.json`, JSON.stringify(trx, null, 2));
}

// ================= FUNCTION DATA AKUN =================

function getDataAkun() {
  try {
    return JSON.parse(fs.readFileSync(`${DATA_PATH}/dataam.json`));
  } catch (err) {
    console.error("Error reading dataam.json:", err);
    return [];
  }
}

function ambilAkunDanHapus(qty) {
  let dataAkun = getDataAkun();
  
  // Cek apakah stok cukup
  if (dataAkun.length < qty) {
    return { success: false, message: "Stok akun tidak mencukupi!" };
  }
  
  // Ambil akun sejumlah qty
  const akunDiambil = dataAkun.slice(0, qty);
  
  // Sisa akun yang tidak diambil
  const sisaAkun = dataAkun.slice(qty);
  
  // Update file dengan sisa akun
  fs.writeFileSync(`${DATA_PATH}/dataam.json`, JSON.stringify(sisaAkun, null, 2));
  
  console.log(`✅ ${qty} akun berhasil diambil. Sisa stok: ${sisaAkun.length}`);
  
  return { success: true, data: akunDiambil };
}

function getStokAkun() {
  return getDataAkun().length;
}


// ================= FUNCTION RUNTIME =================
function getRuntime() {
  const seconds = Math.floor((Date.now() - startTime) / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days} days, ${hours} hours, ${minutes} mins`;
}

// ================= MENU UTAMA =================
function mainMenu(userId) {
  return {
    caption: `
✨ *ABUZY MARKET*

🤖 *Informasi Profile Bot*
User terdaftar : *${getUsers().length}*
Transaksi sukses : *${getTransaksi().length}x*
Username bot : *@AbuuZy_bot*

📊 *Performance Bot*
Runtime bot : *${getRuntime()}*
CPU bot : *${os.cpus()[0].model}*

👤 *Informasi Profile Anda*
ID user : \`${userId}\`
`,
    keyboard: {
      inline_keyboard: [
        [
          { text: "🛒 Buka Katalog", callback_data: "katalog" },
          { text: "🆘 Cara Order", callback_data: "order" }
        ],
        [
          { text: "📊 Informasi Bot", callback_data: "infobot" }
        ]
      ]
    }
  };
}

// ================= FUNCTION PRODUK DETAIL =================
function produkDetail(userId) {
  const s = session[userId];
  const produk = produkList[s.produk];
  const stokReal = getStokAkun(); // Ambil stok dari database
  const total = produk.harga * s.qty;

  return {
    text:
`📦 *${produk.nama}*

${produk.desk}

ᯤ Kuantitas : ${s.qty}
ᯤ Tersedia : ${stokReal}
ᯤ Harga : Rp ${total.toLocaleString('id-ID')}`,
    keyboard: {
      inline_keyboard: [
        [
          { text: "➖", callback_data: "qty_minus" },
          { text: `${s.qty}`, callback_data: "qty_null" },
          { text: "➕", callback_data: "qty_plus" }
        ],
        [{ text: "💳 Bayar", callback_data: "bayar" }],
        [{ text: "⬅ Kembali", callback_data: "katalog" }]
      ]
    }
  };
}

// ================= START =================
bot.onText(/\/start/, async (msg) => {

  const chatId = msg.chat.id;
  saveUser(msg.from.id);

  const menu = mainMenu(msg.from.id);

  const sent = await bot.sendPhoto(
    chatId,
    "https://files.catbox.moe/s6oxnk.jpg",
    {
      caption: menu.caption,
      parse_mode: "Markdown",
      reply_markup: menu.keyboard
    }
  );

  // ❌ Hapus interval lama kalau ada
  if (runtimeIntervals[chatId]) {
    clearInterval(runtimeIntervals[chatId]);
  }

  // ✅ Buat interval baru
  runtimeIntervals[chatId] = setInterval(() => {

    const updated = mainMenu(msg.from.id);

    bot.editMessageCaption(updated.caption, {
      chat_id: chatId,
      message_id: sent.message_id,
      parse_mode: "Markdown",
      reply_markup: updated.keyboard
    }).catch(() => {});

  }, 1000);

});

// ================= CALLBACK =================
bot.on("callback_query", async (query) => {

  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const userId = query.from.id;

  if (!session[userId]) session[userId] = {};

  // ===== INFORMASI BOT =====
  if (query.data === "infobot") {
    // Hapus pesan sebelumnya
    bot.deleteMessage(chatId, messageId).catch(() => {});

    // Kirim pesan baru dengan foto
    bot.sendPhoto(
      chatId,
      "https://files.catbox.moe/s6oxnk.jpg",
      {
        caption:
`👋🏻 *Hallo Welcome!*
*Toko AbuZyOfficial - Auto Order 24 Jam.*
━━━━━━━━━━━━━━
Bot ini dirancang untuk mempermudah 
proses transaksi tanpa perlu menunggu 
admin online. Transaksi diproses secara 
otomatis dan produk akan dikirim secara 
otomatis setelah pembayaran berhasil.
━━━━━━━━━━━━━━
ᯤ Salam hormat
*AbuZyOfficial - Auto Order 24 Jam.*`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "👤 Owner", url: ADMIN_LINK },
              { text: "📢 Channel", url: CHANNEL_LINK }
            ],
            [{ text: "⬅ Kembali", callback_data: "back_menu" }]
          ]
        }
      }
    );
  }

  // ===== CARA ORDER =====
  if (query.data === "order") {
    // Hapus pesan sebelumnya
    bot.deleteMessage(chatId, messageId).catch(() => {});

    // Kirim pesan baru dengan foto
    bot.sendPhoto(
      chatId,
      "https://files.catbox.moe/s6oxnk.jpg",
      {
        caption:
`🆘 *Cara Order*

1️⃣ Klik tombol *Buka Katalog*
2️⃣ Pilih produk yang diinginkan
3️⃣ Atur jumlah qty dengan tombol ➕ dan ➖
4️⃣ Klik tombol *Bayar* 
5️⃣ Upload bukti pembayaran QRIS
6️⃣ Tunggu konfirmasi dari admin
7️⃣ Produk akan dikirim setelah dikonfirmasi

📌 *Catatan:*
- Pastikan bukti pembayaran jelas
- Nominal harus sesuai dengan total harga
- Jika ada kendala, hubungi admin

Butuh bantuan? Hubungi admin kami!`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 Hubungi Admin", url: ADMIN_LINK }],
            [{ text: "⬅ Kembali", callback_data: "back_menu" }]
          ]
        }
      }
    );
  }

 if (query.data === "katalog") {

  const p1 = produkList.alightmotion;
  const p2 = produkList.panelunli;

  const stokReal = getStokAkun();

  bot.editMessageCaption(
`🛍 *Semua Catalog Produk*

━━━━━━━━━━━━━
[ 1 ] ${p1.nama} ${stokReal > 0 ? "✅" : "🚫"}
  ╰┈➤ ᴛᴇʀꜱᴇᴅɪᴀ : ${stokReal} pcs
━━━━━━━━━━━━━
[ 2 ] ${p2.nama} ${stokReal > 0 ? "✅" : "🚫"}
  ╰┈➤ ᴛᴇʀꜱᴇᴅɪᴀ : ${stokReal} pcs
━━━━━━━━━━━━━

Pilih produk`,
  {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
  // Nomor produk (atas)
  [
    { text: "1", callback_data: "produk_alightmotion" },
    { text: "2", callback_data: "produk_panelunli" },
    { text: "3", callback_data: "comingsoon" },
    { text: "4", callback_data: "comingsoon" },
    { text: "5", callback_data: "comingsoon" }
  ],

  // Selanjutnya (tengah)
  [
    { text: "Selanjutnya", callback_data: "next_page" }
  ],

  // Bawah kiri kanan
  [
    { text: "⬅ Kembali", callback_data: "back_menu" },
    { text: "Produk Lainnya", callback_data: "comingsoon" }
  ]

]
    }
  });
}


  if (query.data === "comingsoon") {
  bot.answerCallbackQuery(query.id, {
    text: "Produk belum tersedia",
    show_alert: true
  });
}

if (query.data === "next_page") {
  bot.answerCallbackQuery(query.id, {
    text: "Halaman selanjutnya belum tersedia",
    show_alert: true
  });
}


  // ===== PILIH PRODUK ALIGHT MOTION =====
  if (query.data === "produk_alightmotion") {

    session[userId].produk = "alightmotion";
    session[userId].qty = 1;

    const detail = produkDetail(userId);

    bot.editMessageCaption(detail.text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
      reply_markup: detail.keyboard
    });
  }

  // ===== QTY PLUS =====
  if (query.data === "qty_plus") {

    const s = session[userId];
    const stokReal = getStokAkun(); // Ambil stok dari database

    if (s.qty < stokReal) s.qty++;

    const detail = produkDetail(userId);

    bot.editMessageCaption(detail.text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
      reply_markup: detail.keyboard
    }).catch(() => {});
  }

  // ===== QTY MINUS =====
  if (query.data === "qty_minus") {

    const s = session[userId];

    if (s.qty > 1) s.qty--;

    const detail = produkDetail(userId);

    bot.editMessageCaption(detail.text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
      reply_markup: detail.keyboard
    }).catch(() => {});
  }

  // ===== QTY NULL (No Action) =====
  if (query.data === "qty_null") {
    // Tidak ada aksi, hanya untuk menampilkan angka qty
  }

  // ===== PILIH PRODUK ALIGHT MOTION =====
  if (query.data === "produk_panelunli") {

    session[userId].produk = "panelunli";
    session[userId].qty = 1;

    const detail = produkDetail(userId);

    bot.editMessageCaption(detail.text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
      reply_markup: detail.keyboard
    });
  }

  // ===== BAYAR =====
  if (query.data === "bayar") {

    const s = session[userId];
    const produk = produkList[s.produk];
    const harga = produk.harga * s.qty;
    const feeAdmin = 59;
    const total = harga + feeAdmin;
    
    // Generate reference code
    const refCode = `DEP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Simpan reference ke session
    session[userId].refCode = refCode;
    session[userId].total = total;
    session[userId].step = "waiting_confirm"; // Set step untuk menunggu konfirmasi

    bot.sendPhoto(chatId, "./qris/qris.jpeg", {
      caption:
`💳 *PEMBAYARAN PRODUK*
━━━━━━━━━━━━━
ᯤ Nama Produk : ${produk.nama.toUpperCase()}
ᯤ Jumlah : ${s.qty} pcs
ᯤ Harga : Rp ${harga.toLocaleString('id-ID')}
ᯤ Fee Admin : Rp ${feeAdmin}
ᯤ Total Bayar : Rp ${total.toLocaleString('id-ID')}

*- Reference -*
${refCode}
━━━━━━━━━━━━━
📱 Silahkan Scan & Bayar.
⚠️ Qris Expired Dalam 5 Menit
━━━━━━━━━━━━━
Jika sudah bayar tekan tombol
*Saya Sudah Bayar ✅*`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Saya Sudah Bayar", callback_data: "konfirmasi_bayar" }],
          [{ text: "❌ Cancel", callback_data: "cancel_order" }]
        ]
      }
    });
  }

  // ===== KONFIRMASI BAYAR =====
  if (query.data === "konfirmasi_bayar") {
    
    // Set step ke upload untuk menerima foto
    session[userId].step = "upload";
    
    bot.sendMessage(chatId, 
`📸 *Upload Bukti Pembayaran*

Silahkan kirim screenshot/foto bukti pembayaran Anda.

⚠️ Pastikan bukti pembayaran:
- Terlihat jelas
- Nominal sesuai
- Tidak terpotong

Kirim foto sekarang 👇`
    , { parse_mode: "Markdown" });
  }

  // ===== CANCEL ORDER =====
  if (query.data === "cancel_order") {
    delete session[userId];
    
    bot.sendMessage(chatId, 
`❌ *Pesanan Dibatalkan*

Pesanan Anda telah dibatalkan.
Silahkan order lagi jika berminat.

Terima kasih! 🙏`, 
    { 
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛒 Order Lagi", callback_data: "katalog" }],
          [{ text: "🏠 Menu Utama", callback_data: "back_menu" }]
        ]
      }
    });
  }

  // ===== OWNER ACC =====
  if (query.data.startsWith("acc_")) {

    const id = query.data.split("_")[1];
    const order = pendingOrder[id];

    // Ambil data akun dari database
    const result = ambilAkunDanHapus(order.qty);
    
    if (!result.success) {
      // Jika stok tidak cukup, beri tahu owner
      bot.sendMessage(OWNER_ID, `❌ ${result.message}\nPesanan tidak dapat diproses.`);
      bot.answerCallbackQuery(query.id, { text: result.message, show_alert: true });
      return;
    }

    addTransaksi(order);

    // Hapus pesan konfirmasi lama (pesan "Bukti diterima, menunggu...")
    if (order.confirmMsgId) {
      bot.deleteMessage(order.chatId, order.confirmMsgId).catch(() => {});
    }

    // Format data akun untuk dikirim
    let akunText = "";
    result.data.forEach((akun, index) => {
      akunText += `
━━━━━━━━━━━━━
📱 *AKUN #${index + 1}*
━━━━━━━━━━━━━
📧 Email : \`${akun.email}\`
🔑 Password : \`${akun.password}\`

📝 *Cara Login:*
${akun.caraLogin}
`;
    });

    // Kirim data produk ke buyer
    bot.sendMessage(order.user,
`✅ *PEMBAYARAN DITERIMA!*
━━━━━━━━━━━━━
Selamat! Pembayaran Anda telah dikonfirmasi.

📦 *DETAIL TRANSAKSI*
━━━━━━━━━━━━━
Nama Produk : ${order.produk}
Jumlah : ${order.qty} pcs
Total Bayar : Rp ${order.total.toLocaleString('id-ID')}
Reference : ${order.refCode}

━━━━━━━━━━━━━
📥 *DATA AKUN ANDA*
━━━━━━━━━━━━━
${akunText}
📌 *Informasi Penting:*
✅ Expired 1 Tahun
✅ Legal & Aman
✅ Bisa Menggunakan Semua Fitur Premium
✅ Support Update Aplikasi

⚠️ *Catatan:*
- Simpan data ini dengan baik
- Jangan share ke orang lain
- Hubungi admin jika ada kendala

━━━━━━━━━━━━━
🎉 Terima kasih telah berbelanja!
Semoga puas dengan produk kami 🙏`,
    { 
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "👤 Hubungi Admin", url: ADMIN_LINK }],
          [{ text: "🛒 Order Lagi", callback_data: "katalog" }]
        ]
      }
    });

    // Update pesan di owner
    bot.editMessageCaption(
`✅ *PESANAN DIKONFIRMASI*
━━━━━━━━━━━━━
Order ID : ${id}
User ID : ${order.user}
Produk : ${order.produk}
Jumlah : ${order.qty} pcs
Total : Rp ${order.total.toLocaleString('id-ID')}

Status : *ACC ✅*
Waktu ACC : ${new Date().toLocaleString('id-ID')}
Sisa Stok : ${getStokAkun()} akun`, 
    {
      chat_id: OWNER_ID,
      message_id: query.message.message_id,
      parse_mode: "Markdown"
    });

    delete pendingOrder[id];
  }

  // ===== OWNER TOLAK =====
  if (query.data.startsWith("tolak_")) {

    const id = query.data.split("_")[1];
    const order = pendingOrder[id];

    bot.sendMessage(order.user,
`❌ *PEMBAYARAN DITOLAK*
━━━━━━━━━━━━━
Maaf, pembayaran Anda tidak dapat diverifikasi.

Reference: ${order.refCode}

Kemungkinan alasan:
- Bukti pembayaran tidak jelas
- Nominal tidak sesuai
- Pembayaran belum masuk

Silahkan hubungi admin untuk informasi lebih lanjut atau order ulang.`,
    { 
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "👤 Hubungi Admin", url: ADMIN_LINK }],
          [{ text: "🛒 Order Lagi", callback_data: "katalog" }]
        ]
      }
    });

    bot.editMessageCaption(
`❌ *PESANAN DITOLAK*

Order ID: ${id}
User: ${order.user}
Status: DITOLAK ❌`, 
    {
      chat_id: OWNER_ID,
      message_id: query.message.message_id,
      parse_mode: "Markdown"
    });

    delete pendingOrder[id];
  }

  // ===== BACK MENU =====
  if (query.data === "back_menu") {
    // Hapus pesan sebelumnya
    bot.deleteMessage(chatId, messageId).catch(() => {});

    // Kirim menu utama baru
    const menu = mainMenu(userId);
    bot.sendPhoto(
      chatId,
      "https://files.catbox.moe/s6oxnk.jpg",
      {
        caption: menu.caption,
        parse_mode: "Markdown",
        reply_markup: menu.keyboard
      }
    );
  }

  bot.answerCallbackQuery(query.id);
});

// ================= MESSAGE =================
bot.on("message", async (msg) => {

  const userId = msg.from.id;
  const chatId = msg.chat.id;

  // Skip jika pesan adalah command /start
  if (msg.text && msg.text.startsWith('/')) return;

  if (!session[userId]) return;

  // ===== INPUT QTY =====
  if (session[userId].step === "qty") {

    const qty = parseInt(msg.text);
    if (isNaN(qty)) return bot.sendMessage(chatId, "Masukkan angka!");

    session[userId].qty = qty;
    session[userId].step = null;

    bot.sendMessage(chatId, "Klik bayar", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "💳 Bayar Sekarang", callback_data: "bayar" }]
        ]
      }
    });
  }

  // ===== UPLOAD BUKTI =====
  if (session[userId].step === "upload" && msg.photo) {

    const s = session[userId];
    const produk = produkList[s.produk];

    const orderId = Date.now();

    pendingOrder[orderId] = {
      user: userId,
      produk: produk.nama,
      qty: s.qty,
      total: s.total,
      refCode: s.refCode,
      chatId: chatId // Simpan chatId untuk delete message nanti
    };

    const photo = msg.photo[msg.photo.length - 1].file_id;

    // Kirim ke owner
    bot.sendPhoto(OWNER_ID, photo, {
      caption:
`📥 *ORDER BARU*
━━━━━━━━━━━━━
👤 User ID : ${userId}
📦 Produk : ${produk.nama}
🔢 Jumlah : ${s.qty} pcs
💰 Total : Rp ${s.total.toLocaleString('id-ID')}

*Reference Code:*
${s.refCode}
━━━━━━━━━━━━━
⏰ ${new Date().toLocaleString('id-ID')}`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ ACC", callback_data: `acc_${orderId}` }],
          [{ text: "❌ TOLAK", callback_data: `tolak_${orderId}` }]
        ]
      }
    }).then(() => {
      console.log(`✅ Bukti pembayaran dari user ${userId} berhasil dikirim ke owner`);
    }).catch(err => {
      console.error(`❌ Gagal kirim ke owner:`, err.message);
    });

    // Kirim konfirmasi ke buyer dan simpan message_id
    bot.sendMessage(chatId,
`⏳ *Bukti Pembayaran Diterima*

Terima kasih! Bukti pembayaran Anda sedang diverifikasi oleh admin.

Reference: ${s.refCode}

Mohon tunggu beberapa saat...
Anda akan mendapat notifikasi setelah pembayaran dikonfirmasi.

⏱️ Estimasi: 1-5 menit`, 
    { parse_mode: "Markdown" }).then((sentMsg) => {
      // Simpan message_id untuk dihapus nanti
      pendingOrder[orderId].confirmMsgId = sentMsg.message_id;
    });

    // Reset step tapi jangan hapus session (untuk data reference)
    session[userId].step = null;
  }

});

console.log("Bot Running...");