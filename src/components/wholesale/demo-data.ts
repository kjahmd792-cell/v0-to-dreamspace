import type { DeliveryAgent, Invoice, Order, Pharmacy, Product } from "./types"

const now = new Date("2026-11-13T12:00:00.000Z").getTime()
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString()

type ProductRow = [id: string, name: string, scientificName: string, manufacturer: string, category: string, pack: string, price: number, stock: number, reserved: number, expiry: string, tag?: string]

const productRows: ProductRow[] = [
  ["MED-1042", "بنادول 500 ملغ", "Paracetamol 500mg", "GSK", "مسكنات وخافض حرارة", "علبة · 24 قرصًا", 12, 186, 24, "2027-08", "الأكثر طلبًا"],
  ["MED-1187", "فيفادول شراب أطفال", "Paracetamol 120mg/5ml", "جمجوم فارما", "أدوية الأطفال", "عبوة · 100 مل", 9, 74, 12, "2027-05", "عرض خاص"],
  ["MED-2051", "أوجمنتين 1 غ", "Amoxicillin + Clavulanic acid", "GSK", "مضادات حيوية", "علبة · 14 قرصًا", 48, 18, 8, "2028-02"],
  ["MED-2290", "فيوسيدين كريم", "Fusidic acid 2%", "ليو فارما", "جلدية", "أنبوب · 15 غرامًا", 22, 9, 3, "2027-01", "مخزون منخفض"],
  ["MED-3104", "فولتارين 50 ملغ", "Diclofenac sodium", "نوفارتس", "مسكنات وخافض حرارة", "علبة · 20 قرصًا", 19, 132, 18, "2028-06"],
  ["MED-3288", "جلوكوفاج 850 ملغ", "Metformin HCl", "ميرك", "السكري", "علبة · 30 قرصًا", 15, 46, 6, "2027-12"],
  ["MED-1050", "بروفين 400 ملغ", "Ibuprofen", "أبوت", "مسكنات وخافض حرارة", "علبة · 30 قرصًا", 14, 210, 20, "2028-03"],
  ["MED-1051", "أدول 500 ملغ", "Paracetamol", "جلفار", "مسكنات وخافض حرارة", "علبة · 24 قرصًا", 7, 320, 30, "2027-11"],
  ["MED-1052", "سولبادين فوار", "Paracetamol + Caffeine", "GSK", "مسكنات وخافض حرارة", "علبة · 12 قرصًا فوارًا", 18, 88, 6, "2027-09"],
  ["MED-1053", "بنادول كولد آند فلو", "Paracetamol + Pseudoephedrine", "GSK", "البرد والإنفلونزا", "علبة · 24 قرصًا", 21, 140, 14, "2027-10", "موسمي"],
  ["MED-1054", "كونجستال", "Paracetamol + Chlorpheniramine", "سيجما", "البرد والإنفلونزا", "علبة · 20 قرصًا", 13, 96, 4, "2027-07"],
  ["MED-1055", "تلفاست 120 ملغ", "Fexofenadine", "سانوفي", "الحساسية", "علبة · 15 قرصًا", 34, 64, 5, "2028-01"],
  ["MED-1056", "كلاريتين 10 ملغ", "Loratadine", "باير", "الحساسية", "علبة · 20 قرصًا", 27, 58, 3, "2027-06"],
  ["MED-1057", "زيرتك 10 ملغ", "Cetirizine", "UCB", "الحساسية", "علبة · 20 قرصًا", 24, 72, 8, "2027-12"],
  ["MED-1058", "أموكسيل 500 ملغ", "Amoxicillin", "GSK", "مضادات حيوية", "علبة · 20 كبسولة", 26, 110, 10, "2027-04"],
  ["MED-1059", "زيثروماكس 500 ملغ", "Azithromycin", "فايزر", "مضادات حيوية", "علبة · 3 أقراص", 39, 52, 6, "2027-08"],
  ["MED-1060", "سيبروباي 500 ملغ", "Ciprofloxacin", "باير", "مضادات حيوية", "علبة · 10 أقراص", 31, 44, 2, "2027-10"],
  ["MED-1061", "كلاسيد 500 ملغ", "Clarithromycin", "أبوت", "مضادات حيوية", "علبة · 14 قرصًا", 58, 12, 2, "2027-03", "مخزون منخفض"],
  ["MED-1062", "فلاجيل 500 ملغ", "Metronidazole", "سانوفي", "مضادات حيوية", "علبة · 20 قرصًا", 11, 90, 5, "2028-05"],
  ["MED-1063", "نكسيوم 40 ملغ", "Esomeprazole", "أسترازينيكا", "الجهاز الهضمي", "علبة · 14 قرصًا", 62, 70, 9, "2028-02"],
  ["MED-1064", "لوسك 20 ملغ", "Omeprazole", "أسترازينيكا", "الجهاز الهضمي", "علبة · 14 كبسولة", 38, 84, 4, "2027-09"],
  ["MED-1065", "جافيسكون شراب", "Sodium alginate", "ريكيت", "الجهاز الهضمي", "عبوة · 200 مل", 25, 66, 7, "2027-06"],
  ["MED-1066", "موتيليوم 10 ملغ", "Domperidone", "جانسن", "الجهاز الهضمي", "علبة · 30 قرصًا", 17, 48, 3, "2027-11"],
  ["MED-1067", "إيموديوم 2 ملغ", "Loperamide", "جانسن", "الجهاز الهضمي", "علبة · 6 كبسولات", 14, 102, 6, "2028-04"],
  ["MED-1068", "دوسباتالين 200 ملغ", "Mebeverine", "أبوت", "الجهاز الهضمي", "علبة · 30 كبسولة", 44, 36, 2, "2027-12"],
  ["MED-1069", "كونكور 5 ملغ", "Bisoprolol", "ميرك", "القلب والضغط", "علبة · 30 قرصًا", 29, 80, 10, "2028-01"],
  ["MED-1070", "نورفاسك 5 ملغ", "Amlodipine", "فايزر", "القلب والضغط", "علبة · 30 قرصًا", 33, 96, 12, "2028-03"],
  ["MED-1071", "كوزار 50 ملغ", "Losartan", "MSD", "القلب والضغط", "علبة · 28 قرصًا", 41, 54, 4, "2027-10"],
  ["MED-1072", "ليبيتور 20 ملغ", "Atorvastatin", "فايزر", "القلب والضغط", "علبة · 30 قرصًا", 68, 62, 8, "2028-06", "الأكثر طلبًا"],
  ["MED-1073", "كريستور 10 ملغ", "Rosuvastatin", "أسترازينيكا", "القلب والضغط", "علبة · 28 قرصًا", 74, 40, 3, "2027-09"],
  ["MED-1074", "أسبرين بروتكت 100 ملغ", "Acetylsalicylic acid", "باير", "القلب والضغط", "علبة · 30 قرصًا", 10, 260, 22, "2028-08"],
  ["MED-1075", "بلافيكس 75 ملغ", "Clopidogrel", "سانوفي", "القلب والضغط", "علبة · 28 قرصًا", 85, 28, 2, "2027-07"],
  ["MED-1076", "جانوفيا 100 ملغ", "Sitagliptin", "MSD", "السكري", "علبة · 28 قرصًا", 145, 22, 3, "2027-12"],
  ["MED-1077", "أماريل 2 ملغ", "Glimepiride", "سانوفي", "السكري", "علبة · 30 قرصًا", 36, 50, 5, "2028-02"],
  ["MED-1078", "لانتوس سولوستار", "Insulin glargine", "سانوفي", "السكري", "قلم · 3 مل", 92, 15, 4, "2027-04", "يحفظ مبردًا"],
  ["MED-1079", "نوفورابيد فلكس بن", "Insulin aspart", "نوفو نورديسك", "السكري", "قلم · 3 مل", 88, 8, 2, "2027-03", "مخزون منخفض"],
  ["MED-1080", "فنتولين بخاخ", "Salbutamol 100mcg", "GSK", "الجهاز التنفسي", "بخاخ · 200 جرعة", 23, 76, 6, "2027-11"],
  ["MED-1081", "سيريتايد ديسكس", "Salmeterol + Fluticasone", "GSK", "الجهاز التنفسي", "جهاز · 60 جرعة", 120, 18, 2, "2027-08"],
  ["MED-1082", "سينجيولير 10 ملغ", "Montelukast", "MSD", "الجهاز التنفسي", "علبة · 28 قرصًا", 79, 34, 3, "2028-01"],
  ["MED-1083", "بروسبان شراب", "Ivy leaf extract", "إنجلهارد", "الجهاز التنفسي", "عبوة · 100 مل", 27, 92, 9, "2027-10", "موسمي"],
  ["MED-1084", "موكوسولفان شراب", "Ambroxol", "سانوفي", "الجهاز التنفسي", "عبوة · 100 مل", 16, 60, 4, "2027-06"],
  ["MED-1085", "سنتروم للكبار", "Multivitamin", "هاليون", "فيتامينات ومكملات", "علبة · 30 قرصًا", 55, 70, 6, "2028-05"],
  ["MED-1086", "فيتامين د 50000", "Cholecalciferol", "جمجوم فارما", "فيتامينات ومكملات", "علبة · 4 كبسولات", 28, 140, 15, "2028-07", "الأكثر طلبًا"],
  ["MED-1087", "فيروجلوبين", "Iron + Vitamins", "فيتابيوتكس", "فيتامينات ومكملات", "علبة · 30 كبسولة", 39, 58, 4, "2027-12"],
  ["MED-1088", "أوميجا 3 بلس", "Fish oil 1000mg", "سبيماكو", "فيتامينات ومكملات", "علبة · 60 كبسولة", 46, 44, 2, "2028-03"],
  ["MED-1089", "ألتروكسين 50 ميكروغرام", "Levothyroxine", "ميرك", "الغدد والهرمونات", "علبة · 100 قرص", 18, 64, 5, "2027-09"],
  ["MED-1090", "بيبانثين مرهم", "Dexpanthenol 5%", "باير", "جلدية", "أنبوب · 30 غرامًا", 29, 80, 6, "2028-02"],
  ["MED-1091", "بيتنوفيت كريم", "Betamethasone", "GSK", "جلدية", "أنبوب · 30 غرامًا", 15, 38, 1, "2027-05"],
  ["MED-1092", "تيربينافين كريم", "Terbinafine 1%", "سبيماكو", "جلدية", "أنبوب · 15 غرامًا", 21, 47, 3, "2027-11"],
  ["MED-1093", "سيستال قطرة عين", "Polyethylene glycol", "ألكون", "العيون", "عبوة · 10 مل", 32, 55, 4, "2027-08"],
]

export const demoProducts: Product[] = productRows.map(([id, name, scientificName, manufacturer, category, pack, price, stock, reserved, expiry, tag]) => ({
  id,
  name,
  scientificName,
  manufacturer,
  category,
  pack,
  price,
  stock,
  reserved,
  expiry,
  code: `628${id.replace("MED-", "").padStart(8, "0")}`,
  ...(tag ? { tag } : {}),
}))

const orderItems = (entries: Array<[string, number]>) => entries.map(([productId, quantity]) => {
  const product = demoProducts.find((item) => item.id === productId)!
  return { productId, name: product.name, quantity, unitPrice: product.price }
})

export const demoOrders: Order[] = [
  { id: "ORD-242", pharmacy: "صيدلية الندى التجريبية", pharmacyPhone: "050 000 0141", region: "حي الندى، الرياض", items: orderItems([["MED-1050", 6], ["MED-1086", 2]]), total: 140, orderStatus: "delivered", deliveryStatus: "delivered", paymentStatus: "partially_paid", paymentMethod: "نقدًا عند التسليم", paidAmount: 80, assignedTo: "DA-102", createdAt: hoursAgo(14), invoiceId: "INV-242", recipientName: "مها العتيبي", deliveryAddress: "حي الندى، شارع الأمير ناصر", deliveryProof: { recipient: "مها العتيبي", collectedAmount: 80, paymentMethod: "نقدًا", note: "تمت مراجعة الأصناف عند الاستلام", deliveredAt: hoursAgo(12), otpVerified: true } },
  { id: "ORD-241", pharmacy: "صيدلية الندى التجريبية", pharmacyPhone: "050 000 0141", region: "حي الندى، الرياض", items: orderItems([["MED-1042", 8], ["MED-1187", 5]]), total: 476, orderStatus: "pending", deliveryStatus: null, paymentStatus: "unpaid", paymentMethod: "آجل", paidAmount: 0, assignedTo: null, createdAt: hoursAgo(1), invoiceId: null, recipientName: "مها العتيبي", deliveryAddress: "حي الندى، شارع الأمير ناصر", requestedDeliveryWindow: "صباحًا", note: "التسليم قبل الساعة ٢ مساءً" },
  { id: "ORD-240", pharmacy: "صيدلية الشفاء التجريبية", pharmacyPhone: "050 000 0183", region: "حي الملقا، الرياض", items: orderItems([["MED-2051", 4], ["MED-2290", 6]]), total: 464, orderStatus: "accepted", deliveryStatus: null, paymentStatus: "unpaid", paymentMethod: "تحويل بنكي", paidAmount: 0, assignedTo: null, createdAt: hoursAgo(2), invoiceId: null, recipientName: "نورة الحربي", deliveryAddress: "حي الملقا، طريق أنس بن مالك", requestedDeliveryWindow: "بعد الظهر" },
  { id: "ORD-239", pharmacy: "صيدلية الياسمين التجريبية", pharmacyPhone: "050 000 0294", region: "حي الياسمين، الرياض", items: orderItems([["MED-3104", 12], ["MED-3288", 3]]), total: 384, orderStatus: "ready", deliveryStatus: null, paymentStatus: "unpaid", paymentMethod: "نقدًا عند التسليم", paidAmount: 0, assignedTo: null, createdAt: hoursAgo(3), invoiceId: null, recipientName: "سارة المطيري", deliveryAddress: "حي الياسمين، شارع أبي بكر" },
  { id: "ORD-238", pharmacy: "صيدلية الندى التجريبية", pharmacyPhone: "050 000 0141", region: "حي الندى، الرياض", items: orderItems([["MED-1042", 10], ["MED-2290", 4]]), total: 556, orderStatus: "out_for_delivery", deliveryStatus: "on_way", paymentStatus: "unpaid", paymentMethod: "نقدًا عند التسليم", paidAmount: 0, assignedTo: "DA-101", createdAt: hoursAgo(4), invoiceId: "INV-238", recipientName: "مها العتيبي", deliveryAddress: "حي الندى، شارع الأمير ناصر" },
  { id: "ORD-237", pharmacy: "صيدلية الشفاء التجريبية", pharmacyPhone: "050 000 0183", region: "حي الملقا، الرياض", items: orderItems([["MED-1187", 8], ["MED-3104", 7]]), total: 357, orderStatus: "delivered", deliveryStatus: "delivered", paymentStatus: "partially_paid", paymentMethod: "نقدًا عند التسليم", paidAmount: 100, assignedTo: "DA-102", createdAt: hoursAgo(7), invoiceId: "INV-237", recipientName: "نورة الحربي", deliveryAddress: "حي الملقا، طريق أنس بن مالك", deliveryProof: { recipient: "نورة الحربي", collectedAmount: 100, paymentMethod: "نقدًا", note: "تم التسليم في الاستقبال", deliveredAt: hoursAgo(5) } },
  { id: "ORD-236", pharmacy: "صيدلية الندى التجريبية", pharmacyPhone: "050 000 0141", region: "حي الندى، الرياض", items: orderItems([["MED-2051", 3], ["MED-3288", 2]]), total: 299, orderStatus: "ready", deliveryStatus: "failed", paymentStatus: "unpaid", paymentMethod: "نقدًا عند التسليم", paidAmount: 0, assignedTo: "DA-101", createdAt: hoursAgo(9), invoiceId: "INV-236", rejectionReason: "الصيدلية مغلقة · إعادة المحاولة مطلوبة" },
]

export const demoPharmacies: Pharmacy[] = [
  { id: "PH-1001", name: "صيدلية الندى التجريبية", contact: "050 000 0141", region: "حي الندى، الرياض", license: "ترخيص تجريبي · 1001", status: "approved", balance: 556, lastOrder: "اليوم، ٩:٢٤ ص" },
  { id: "PH-1002", name: "صيدلية الشفاء التجريبية", contact: "050 000 0183", region: "حي الملقا، الرياض", license: "ترخيص تجريبي · 1002", status: "approved", balance: 721, lastOrder: "اليوم، ٨:٥٠ ص" },
  { id: "PH-1003", name: "صيدلية الياسمين التجريبية", contact: "050 000 0294", region: "حي الياسمين، الرياض", license: "ترخيص تجريبي · 1003", status: "pending", balance: 0, lastOrder: "لا يوجد" },
  { id: "PH-1004", name: "صيدلية الروضة التجريبية", contact: "050 000 0312", region: "حي الروضة، الرياض", license: "ترخيص تجريبي · 1004", status: "suspended", balance: 820, lastOrder: "أمس، ٤:١٢ م" },
]

export const demoInvoices: Invoice[] = [
  { id: "INV-242", orderId: "ORD-242", pharmacy: "صيدلية الندى التجريبية", issuedAt: hoursAgo(14), total: 140, paidAmount: 80, paymentMethod: "نقدًا عند التسليم" },
  { id: "INV-238", orderId: "ORD-238", pharmacy: "صيدلية الندى التجريبية", issuedAt: hoursAgo(4), total: 556, paidAmount: 0, paymentMethod: "نقدًا عند التسليم" },
  { id: "INV-237", orderId: "ORD-237", pharmacy: "صيدلية الشفاء التجريبية", issuedAt: hoursAgo(7), total: 357, paidAmount: 100, paymentMethod: "نقدًا عند التسليم" },
  { id: "INV-236", orderId: "ORD-236", pharmacy: "صيدلية الندى التجريبية", issuedAt: hoursAgo(9), total: 299, paidAmount: 0, paymentMethod: "نقدًا عند التسليم" },
]

const archivePharmacies = [
  { name: "صيدلية الندى التجريبية", phone: "050 000 0141", region: "حي الندى، الرياض", recipient: "مها العتيبي" },
  { name: "صيدلية الشفاء التجريبية", phone: "050 000 0183", region: "حي الملقا، الرياض", recipient: "نورة الحربي" },
  { name: "صيدلية الياسمين التجريبية", phone: "050 000 0294", region: "حي الياسمين، الرياض", recipient: "سارة المطيري" },
  { name: "صيدلية الروضة التجريبية", phone: "050 000 0312", region: "حي الروضة، الرياض", recipient: "خالد القحطاني" },
]
const archiveMethods = ["نقدًا عند التسليم", "تحويل بنكي", "آجل", "شبكة (مدى)"]
const archiveAgents = ["DA-101", "DA-102", "DA-103"]

export const demoArchiveOrders: Order[] = Array.from({ length: 56 }, (_, index) => {
  const pharmacy = archivePharmacies[(index * 3 + 1) % archivePharmacies.length]!
  const items = orderItems(Array.from({ length: 2 + (index % 3) }, (_, line) => [demoProducts[(index * 7 + line * 11) % demoProducts.length]!.id, 2 + ((index + line * 5) % 9)] as [string, number]))
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const createdAt = hoursAgo(26 + index * 31)
  const number = 235 - index
  const status = index % 13 === 7 ? "rejected" : index % 11 === 5 ? "cancelled" : "delivered"
  const paidAmount = status !== "delivered" ? 0 : index % 5 === 0 ? Math.round(total / 2) : index % 7 === 3 ? 0 : total
  const method = archiveMethods[index % archiveMethods.length]!
  const delivered = status === "delivered"
  return {
    id: `ORD-${number}`,
    pharmacy: pharmacy.name,
    pharmacyPhone: pharmacy.phone,
    region: pharmacy.region,
    items,
    total,
    orderStatus: status,
    deliveryStatus: delivered ? "delivered" : null,
    paymentStatus: paidAmount >= total ? "paid" : paidAmount > 0 ? "partially_paid" : "unpaid",
    paymentMethod: method,
    paidAmount,
    assignedTo: delivered ? archiveAgents[index % archiveAgents.length]! : null,
    createdAt,
    invoiceId: delivered ? `INV-${number}` : null,
    recipientName: pharmacy.recipient,
    deliveryAddress: pharmacy.region,
    rejectionReason: status === "rejected" ? "نفاد كمية أحد الأصناف" : status === "cancelled" ? "ألغته الصيدلية قبل التجهيز" : undefined,
    deliveryProof: delivered ? { recipient: pharmacy.recipient, collectedAmount: paidAmount, paymentMethod: method, note: index % 4 === 0 ? "تم التسليم للصيدلي المناوب" : "", deliveredAt: hoursAgo(20 + index * 31), otpVerified: index % 6 !== 2 } : undefined,
  } satisfies Order
})

export const demoDeliveryAgents: DeliveryAgent[] = [
  { id: "DA-101", name: "عمر السبيعي", phone: "050 000 0221", region: "شمال الرياض", status: "busy" },
  { id: "DA-102", name: "سارة الحربي", phone: "050 000 0222", region: "وسط الرياض", status: "available" },
  { id: "DA-103", name: "فيصل المطيري", phone: "050 000 0223", region: "شرق الرياض", status: "available" },
]
