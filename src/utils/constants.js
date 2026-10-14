export const STUDENT_PROFILE = {
  id: 'siswa-001',
  nama: 'Bayu Setiawan',
  nisn: '0054819231',
  nis: '21221045',
  kelas: 'XII Rekayasa Perangkat Lunak 1',
  kelasShort: 'XII RPL 1',
  jurusan: 'Rekayasa Perangkat Lunak',
  tahunAjaran: 'TA 2024/2025',
  jenisKelamin: 'Laki-laki (L)',
  tempatTglLahir: 'Bandung, 14 Mei 2007',
  email: 'bayu.setiawan@siswa.nexus.sch.id',
  noHp: '+62 812-3456-7890',
  waliMurid: 'Hendra Setiawan',
  satuanPendidikan: 'SMK Nexus Informatika',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlTkDYA5p8Fq1296GmYuK9yNZj_uprePgfaNW0QZC2a8UBSczOuHn6gfHuVjei6i-dUUUvIVXj14R5fK6dPrKEni78B34WAoFK8ytDxAtvFSRLZJvtB8IROZomzZzmHikDlt4g1Gm7_PC8ryVxvzRwXRLKsW7jeho2O7MfuauN-eiGGJJPmZTyCcmC0sJyZGseYgXeESV_dsniRO0I4ty3FL-Pvjnfw3nJ5r8HZd-sPGmoAqM-e8KaOw',
  waliKelas: {
    nama: 'Budi Santoso, S.Pd., M.Kom',
    nip: '19800315 200501 1 008',
    peran: 'Guru Kejuruan RPL & Konselor',
    noWa: '6281298765432',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXwVovi1Sp1tnwIoAAFrbMHW1wiCWcaTMmioCGxXwufz7QaC4WcgdFR77lKn9h5n1xggMK7SczPr_aE6SBrWE8fJoYIdpoRz4JZQXcCqQGhUPU_NuW1nmVueCzJMBs2pQJXOvKp68yPWia4hrvgiCi6xnzO0f4911AYgjW7dmXuT_98r3Vgq-ITpo6zuvj9kYKJpJIWMwZMWVUoMxyAc05k1OPiWTCPQqCFMIq25EXvRKzzMsaCkAzVw'
  },
  stats: {
    kehadiranRate: 95.2,
    hadir: 18,
    sakit: 1,
    izin: 1,
    alpha: 0,
    sisaKuotaIzin: 4,
    totalKuotaIzin: 8
  }
};

export const INITIAL_ATTENDANCE_LOGS = [
  {
    id: 'att-1',
    tanggal: 'Senin, 21 Okt 2024',
    rawDate: '2024-10-21',
    waktu: '07:12 WIB',
    status: 'hadir',
    statusLabel: 'Hadir',
    keterangan: 'Tepat Waktu',
    lokasi: 'Ruang Lab RPL 1 (Geotag Valid)',
    metode: 'Selfie AI + QR Gerbang',
    radius: '12m dari Titik Sekolah',
    foto: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHrJ_HmYs1ayko6JsFCk03EpLPeWmnNzGlgMCC19lgyQSjyNpDGNnp6aNaLsSSVnMxTKPEK3NX-8nS0i9WkZuAlH4WXapWKJx3kXCCBqXzx7XXQljPFJeFQt5UutqjVsrSqB2jTPab9h4h5-eGXJ1rZ1BpYBV47crKEXHAwnveY2gBOEdruOMGN1EgLQPjwskFgY9Vg6OTggcdcOxb13d2B3gtDiafLdRFwsesYSQDmc0epYgOqzP-yg'
  },
  {
    id: 'att-2',
    tanggal: 'Jumat, 18 Okt 2024',
    rawDate: '2024-10-18',
    waktu: '07:15 WIB',
    status: 'hadir',
    statusLabel: 'Hadir',
    keterangan: 'Tepat Waktu',
    lokasi: 'Gerbang Utama SMAN 1',
    metode: 'Face Match 99.4%',
    radius: '15 Menit sebelum bel',
    foto: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpyGyDqp5ar19FyPxRPokvXSusV-AVEaDa_CuQOIPc9EIXFmfVvE0TzXzUFLpuYurrlQpgt4Ok8f22IL-rm6CW522B7zxA0K33v2h9ogaE9Srn0C9aPY2Dg1pJ1gNQtWNI0azwbbQtiof4ngnZtHd7bMR0VfVMQLGWyEXPh7hf83hg2KC_B5K2ZFUR0VKnusYrmEA4dLiPIwxupSC9KQeQw3Ej1qLptCNcKnEwEMcGgUympIaWdKtZQg'
  },
  {
    id: 'att-3',
    tanggal: 'Kamis, 17 Okt 2024',
    rawDate: '2024-10-17',
    waktu: '-',
    status: 'izin',
    statusLabel: 'Izin',
    keterangan: 'Disetujui Guru BK',
    lokasi: 'Lomba FLS2N Tingkat Kota (Surat Tugas)',
    metode: 'SK-DISDIK/1042/2024',
    lampiran: 'Surat_Dispensasi_Resmi.pdf',
    lampiranSize: '420 KB',
    foto: null
  },
  {
    id: 'att-4',
    tanggal: 'Rabu, 16 Okt 2024',
    rawDate: '2024-10-16',
    waktu: '07:05 WIB',
    status: 'hadir',
    statusLabel: 'Hadir',
    keterangan: 'Lebih Awal',
    lokasi: 'Kelas XII RPL 2 (Scanner Barcode)',
    metode: 'Dynamic Token Homeroom',
    radius: 'Petugas Piket: Drs. Bambang S.',
    foto: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZlM7V7guflRvB-ehr1C33Ayhw7jcbMjGKXs-fCC8akHRPj7Q9tfvyJvpt6J4H7YyiRzwhAdWkDK-KyXNEUqSRogpel8nAj5I-bQHGr0BS198NDmIfa2aNjOQnZRDh1xrcaeHWC6FR3PyGTfs8R2EI9Dr0RMReEg9YeD4R4BBxz4bhbUovZ5yFIvdvkGLE0QvX7br8QxWysrV5vHhbpqrzpzaT2Jlk6PlCkPYcphhmN0kIPaOD1lt49Q'
  },
  {
    id: 'att-5',
    tanggal: 'Selasa, 15 Okt 2024',
    rawDate: '2024-10-15',
    waktu: '-',
    status: 'sakit',
    statusLabel: 'Sakit',
    keterangan: 'Disetujui Wali Kelas',
    lokasi: 'Surat Keterangan Dokter Terlampir',
    metode: 'Fasilitas Kesehatan: Klinik Pratama Husada',
    lampiran: 'Surat_Keterangan_Sakit_Dr_Anisa.jpg',
    lampiranSize: '890 KB',
    foto: null
  }
];

export const INITIAL_LEAVE_REQUESTS = [
  {
    id: 'leave-1',
    judul: 'Sakit - Rawat Jalan',
    kategori: 'sakit',
    tanggal: '23 Okt 2024',
    rawDate: '2024-10-23',
    durasi: '1 Hari',
    diajukan: '23 Okt 2024, 07:15',
    status: 'pending',
    statusLabel: 'Menunggu',
    deskripsi: 'Mengalami demam dan radang tenggorokan setelah kegiatan pramuka sabtu lalu.',
    lampiranNama: 'surat_klinik_medika.pdf',
    lampiranSize: '1.2 MB',
    approver: null
  },
  {
    id: 'leave-2',
    judul: 'Sakit - Flu & Demam',
    kategori: 'sakit',
    tanggal: '12 Okt 2024',
    rawDate: '2024-10-12',
    durasi: '1 Hari',
    diajukan: '12 Okt 2024, 06:40',
    status: 'approved',
    statusLabel: 'Disetujui',
    deskripsi: 'Istirahat di rumah sesuai anjuran dokter puskesmas.',
    lampiranNama: 'surat_dokter_21okt.jpg',
    lampiranSize: '1.4 MB',
    approver: 'Bpk. Suryadi (Wali Kelas)'
  },
  {
    id: 'leave-3',
    judul: 'Izin - Urusan Keluarga',
    kategori: 'izin',
    tanggal: '02 Okt 2024',
    rawDate: '2024-10-02',
    durasi: '1 Hari',
    diajukan: '01 Okt 2024, 19:20',
    status: 'approved',
    statusLabel: 'Disetujui',
    deskripsi: 'Menghadiri acara pernikahan kakak kandung di Bandung.',
    lampiranNama: 'undangan_pernikahan.pdf',
    lampiranSize: '850 KB',
    approver: 'Bpk. Suryadi (Wali Kelas)'
  }
];

export const SCHEDULE_DATA = {
  senin: {
    label: 'Senin',
    badge: 'Hari Ini',
    sesiCount: 6,
    activeSession: {
      mapel: 'Pemrograman Web',
      jam: '07:30 - 09:30 WIB',
      ruangan: 'Lab Komputer RPL 1',
      guru: 'Pak Budi Santoso, S.Kom',
      nip: '19820412 200801 1 009',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0mtrEGcNxqsdW7A3iDl0mGH6VxKbBcVGCS6i-vJfCGC-JfJq8qUsRazTfOk4_wZI-13q9IFt7xzhcnRINEsa-uwHxZOUY0M6UuhUKFvZ-SNhBD6tchsoWdawy6D2ci5I0lEnCLCZG5kiUTqEnfns_gChXFbnkZo8T7fmsAo1MghnkrJpxJMfwgR-hClHNbPUWT36y48moii73WeYmo-Z6lU-cU0O7mIAX8oYqqu7VUGyD2K6V_JkUEw',
      progressPercent: 60,
      sisaWaktu: 'Sisa 48 mnt'
    },
    items: [
      {
        id: 's-1',
        jam: '07:00 - 07:30 WIB',
        mapel: 'Apel Pagi & Pembiasaan',
        lokasi: 'Lapangan Utama',
        pengajar: 'Tim Kesiswaan',
        status: 'selesai',
        statusLabel: 'Selesai',
        type: 'ceremony'
      },
      {
        id: 's-2',
        jam: '07:30 - 09:30 WIB',
        mapel: 'Pemrograman Web',
        lokasi: 'Lab Komputer RPL 1',
        pengajar: 'Budi Santoso, S.Kom',
        nip: '19820412 200801 1 009',
        status: 'aktif',
        statusLabel: 'Hadir',
        type: 'mapel'
      },
      {
        id: 's-3',
        jam: '09:30 - 09:45 WIB',
        mapel: 'Istirahat Pertama',
        lokasi: 'Kantin & Area Sekolah',
        pengajar: '15 Menit',
        status: 'istirahat',
        statusLabel: '15 Menit',
        type: 'break',
        icon: 'local_cafe'
      },
      {
        id: 's-4',
        jam: '09:45 - 11:45 WIB',
        mapel: 'Basis Data Relasional',
        lokasi: 'Lab RPL 2 (Gedung B Lt. 2)',
        pengajar: 'Siti Aminah, M.Kom',
        guruAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACSFHdtsN_8ZNBj-Qvy5qo5gAFjT-prARNr2dPNavJEBtCA-FQt_larHFvMYK1oQi7-ur5O3vm4v0g56QrdNnjP1IZh1aX9xRt_pdWM6Pjp-9PnGajG2dSyq60dohSXr-8i3O4kZGtanPZRNNCVLrRP47Jek8NnDBlEdK2ET7MiKr_2sH8kHnk5mrBKQsci-dmo24oCr3q1mJkeVxhT4wSplBpBBIMb8EdM2ulyBjcnhnYz7pG_XGIsA',
        status: 'upcoming',
        statusLabel: 'Akan Datang',
        type: 'mapel'
      },
      {
        id: 's-5',
        jam: '11:45 - 12:30 WIB',
        mapel: 'Istirahat & Sholat Dzuhur',
        lokasi: 'Masjid Al-Ikhlas SMAN 1',
        pengajar: '45 Menit',
        status: 'istirahat',
        statusLabel: '45 Menit',
        type: 'break',
        icon: 'mosque'
      },
      {
        id: 's-6',
        jam: '12:30 - 14:30 WIB',
        mapel: 'Pemodelan Perangkat Lunak',
        lokasi: 'Kelas XII RPL 1 (Ruang Teori 12)',
        pengajar: 'Hendra Wijaya, S.T',
        guruAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJt89l3lEFySspHmBtN_0JLZSLnbpsQ-Owm1ur4zdl42DYCkna3hetJeHSWWMc1PJy7JACvxui3MX8hkENIoGl-jQx_DmwExKEqt_sP_EpieZ-qLNszSfhhCs2VPQ6j7Ng4TM1Ov7wrGj0fumNVcdpoZbnvOGUg9dGWk-hz1br8sZqDCMYd-FH1y2PeAwUbRPLc71wBIg8Eh7z0sNHcdiITh7CBy5QwnCaFsXQuWbGgbIohHMUEiRQyw',
        status: 'upcoming',
        statusLabel: 'Akan Datang',
        type: 'mapel'
      }
    ]
  },
  selasa: {
    label: 'Selasa',
    badge: '5 Sesi',
    sesiCount: 5,
    activeSession: null,
    items: [
      {
        id: 'sel-1',
        jam: '07:15 - 09:15 WIB',
        mapel: 'Pemrograman Berorientasi Objek',
        lokasi: 'Lab RPL 1',
        pengajar: 'Hendra Wijaya, S.T',
        status: 'upcoming',
        statusLabel: 'Jadwal Reguler',
        type: 'mapel'
      },
      {
        id: 'sel-2',
        jam: '09:15 - 09:30 WIB',
        mapel: 'Istirahat Pertama',
        lokasi: 'Area Sekolah',
        pengajar: '15 Menit',
        status: 'istirahat',
        statusLabel: '15 Menit',
        type: 'break',
        icon: 'local_cafe'
      },
      {
        id: 'sel-3',
        jam: '09:30 - 11:30 WIB',
        mapel: 'Matematika Terapan',
        lokasi: 'Ruang Teori 12',
        pengajar: 'Dra. Endang W.',
        status: 'upcoming',
        statusLabel: 'Jadwal Reguler',
        type: 'mapel'
      },
      {
        id: 'sel-4',
        jam: '11:30 - 12:15 WIB',
        mapel: 'Istirahat & Dzuhur',
        lokasi: 'Masjid Sekolah',
        pengajar: '45 Menit',
        status: 'istirahat',
        statusLabel: '45 Menit',
        type: 'break',
        icon: 'mosque'
      },
      {
        id: 'sel-5',
        jam: '12:15 - 14:15 WIB',
        mapel: 'Bahasa Inggris Kejuruan',
        lokasi: 'Lab Bahasa',
        pengajar: 'Maya Puspita, M.Pd',
        status: 'upcoming',
        statusLabel: 'Jadwal Reguler',
        type: 'mapel'
      }
    ]
  },
  rabu: {
    label: 'Rabu',
    badge: '4 Sesi',
    sesiCount: 4,
    activeSession: null,
    items: [
      {
        id: 'rab-1',
        jam: '07:15 - 09:45 WIB',
        mapel: 'Projek Kreatif & Kewirausahaan (PKK)',
        lokasi: 'Studio Kreatif RPL',
        pengajar: 'Budi Santoso, S.Kom',
        status: 'upcoming',
        statusLabel: 'Jadwal Reguler',
        type: 'mapel'
      },
      {
        id: 'rab-2',
        jam: '09:45 - 10:00 WIB',
        mapel: 'Istirahat Pertama',
        lokasi: 'Kantin',
        pengajar: '15 Menit',
        status: 'istirahat',
        statusLabel: '15 Menit',
        type: 'break',
        icon: 'local_cafe'
      },
      {
        id: 'rab-3',
        jam: '10:00 - 12:00 WIB',
        mapel: 'Administrasi Infrastruktur Jaringan',
        lokasi: 'Lab Jaringan Komputer',
        pengajar: 'Ahmad Fauzi, S.Kom',
        status: 'upcoming',
        statusLabel: 'Jadwal Reguler',
        type: 'mapel'
      },
      {
        id: 'rab-4',
        jam: '12:45 - 14:15 WIB',
        mapel: 'Pendidikan Pancasila & Kewarganegaraan',
        lokasi: 'Ruang Teori 12',
        pengajar: 'Drs. Bambang S.',
        status: 'upcoming',
        statusLabel: 'Jadwal Reguler',
        type: 'mapel'
      }
    ]
  },
  kamis: {
    label: 'Kamis',
    badge: '5 Sesi',
    sesiCount: 5,
    activeSession: null,
    items: [
      {
        id: 'kam-1',
        jam: '07:15 - 09:15 WIB',
        mapel: 'Pemrograman Mobile (Android)',
        lokasi: 'Lab RPL 1',
        pengajar: 'Budi Santoso, S.Kom',
        status: 'upcoming',
        statusLabel: 'Jadwal Reguler',
        type: 'mapel'
      },
      {
        id: 'kam-2',
        jam: '09:15 - 09:30 WIB',
        mapel: 'Istirahat Pertama',
        lokasi: 'Area Sekolah',
        pengajar: '15 Menit',
        status: 'istirahat',
        statusLabel: '15 Menit',
        type: 'break',
        icon: 'local_cafe'
      },
      {
        id: 'kam-3',
        jam: '09:30 - 11:30 WIB',
        mapel: 'Keamanan Jaringan & Sistem',
        lokasi: 'Lab Siber',
        pengajar: 'Ahmad Fauzi, S.Kom',
        status: 'upcoming',
        statusLabel: 'Jadwal Reguler',
        type: 'mapel'
      },
      {
        id: 'kam-4',
        jam: '11:30 - 12:15 WIB',
        mapel: 'Istirahat & Dzuhur',
        lokasi: 'Masjid Sekolah',
        pengajar: '45 Menit',
        status: 'istirahat',
        statusLabel: '45 Menit',
        type: 'break',
        icon: 'mosque'
      },
      {
        id: 'kam-5',
        jam: '12:15 - 14:15 WIB',
        mapel: 'Bimbingan Konseling & Karir',
        lokasi: 'Ruang BK',
        pengajar: 'Dra. Rini Astuti',
        status: 'upcoming',
        statusLabel: 'Jadwal Reguler',
        type: 'mapel'
      }
    ]
  },
  jumat: {
    label: 'Jumat',
    badge: '3 Sesi',
    sesiCount: 3,
    activeSession: null,
    items: [
      {
        id: 'jum-1',
        jam: '06:45 - 07:30 WIB',
        mapel: 'Senam Pagi & Literasi Rohani',
        lokasi: 'Lapangan Utama',
        pengajar: 'Pembina OSIS',
        status: 'upcoming',
        statusLabel: 'Kegiatan Bersama',
        type: 'ceremony'
      },
      {
        id: 'jum-2',
        jam: '07:30 - 09:30 WIB',
        mapel: 'Pendidikan Agama & Budi Pekerti',
        lokasi: 'Ruang Teori 12',
        pengajar: 'Ust. Ridwan, M.Pd.I',
        status: 'upcoming',
        statusLabel: 'Jadwal Reguler',
        type: 'mapel'
      },
      {
        id: 'jum-3',
        jam: '09:45 - 11:15 WIB',
        mapel: 'Pendidikan Jasmani & Olahraga',
        lokasi: 'Gelanggang Olahraga',
        pengajar: 'Bambang Irawan, S.Pd',
        status: 'upcoming',
        statusLabel: 'Jadwal Reguler',
        type: 'mapel'
      }
    ]
  },
  sabtu: {
    label: 'Sabtu',
    badge: 'Eskul',
    sesiCount: 2,
    activeSession: null,
    items: [
      {
        id: 'sab-1',
        jam: '08:00 - 10:30 WIB',
        mapel: 'Ekstrakurikuler Nexus Coding Club (Robotics & IoT)',
        lokasi: 'Lab Komputer RPL 1',
        pengajar: 'Budi Santoso, S.Kom',
        status: 'upcoming',
        statusLabel: 'Ekstrakurikuler',
        type: 'mapel'
      },
      {
        id: 'sab-2',
        jam: '10:30 - 12:00 WIB',
        mapel: 'Latihan Pramuka Garuda',
        lokasi: 'Lapangan Utama',
        pengajar: 'Kak Pembina Pramuka',
        status: 'upcoming',
        statusLabel: 'Wajib Ekstrakurikuler',
        type: 'ceremony'
      }
    ]
  }
};
