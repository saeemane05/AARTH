export type UiLang = 'en' | 'mr' | 'hi'

type SchemeLike = {
  amount?: number
  benefit?: string
  name?: string
}

const DISTRICT_TRANSLATIONS: Record<string, { mr: string; hi: string }> = {
  Ahmednagar: { mr: 'अहिल्यानगर', hi: 'अहिल्यानगर' },
  Ahilyanagar: { mr: 'अहिल्यानगर', hi: 'अहिल्यानगर' },
  Akola: { mr: 'अकोला', hi: 'अकोला' },
  Amravati: { mr: 'अमरावती', hi: 'अमरावती' },
  Aurangabad: { mr: 'छत्रपती संभाजीनगर', hi: 'छत्रपति संभाजीनगर' },
  Beed: { mr: 'बीड', hi: 'बीड' },
  Bhandara: { mr: 'भंडारा', hi: 'भंडारा' },
  Buldhana: { mr: 'बुलढाणा', hi: 'बुलढाणा' },
  Chandrapur: { mr: 'चंद्रपूर', hi: 'चंद्रपुर' },
  'Chhatrapati Sambhajinagar': { mr: 'छत्रपती संभाजीनगर', hi: 'छत्रपति संभाजीनगर' },
  Dharashiv: { mr: 'धाराशिव', hi: 'धाराशिव' },
  Dhule: { mr: 'धुळे', hi: 'धुले' },
  Gadchiroli: { mr: 'गडचिरोली', hi: 'गढ़चिरौली' },
  Gondia: { mr: 'गोंदिया', hi: 'गोंदिया' },
  Gondiya: { mr: 'गोंदिया', hi: 'गोंदिया' },
  Hingoli: { mr: 'हिंगोली', hi: 'हिंगोली' },
  Jalgaon: { mr: 'जळगाव', hi: 'जलगांव' },
  Jalna: { mr: 'जालना', hi: 'जालना' },
  Kolhapur: { mr: 'कोल्हापूर', hi: 'कोल्हापुर' },
  Latur: { mr: 'लातूर', hi: 'लातूर' },
  Mumbai: { mr: 'मुंबई', hi: 'मुंबई' },
  'Mumbai City': { mr: 'मुंबई शहर', hi: 'मुंबई शहर' },
  Nagpur: { mr: 'नागपूर', hi: 'नागपुर' },
  Nanded: { mr: 'नांदेड', hi: 'नांदेड़' },
  Nandurbar: { mr: 'नंदुरबार', hi: 'नंदुरबार' },
  Nashik: { mr: 'नाशिक', hi: 'नासिक' },
  Osmanabad: { mr: 'धाराशिव', hi: 'धाराशिव' },
  Paghar: { mr: 'पालघर', hi: 'पालघर' },
  Palghar: { mr: 'पालघर', hi: 'पालघर' },
  Parbhani: { mr: 'परभणी', hi: 'परभणी' },
  Pune: { mr: 'पुणे', hi: 'पुणे' },
  Raigad: { mr: 'रायगड', hi: 'रायगढ़' },
  Ratnagiri: { mr: 'रत्नागिरी', hi: 'रत्नागिरी' },
  Sangli: { mr: 'सांगली', hi: 'सांगली' },
  Satara: { mr: 'सातारा', hi: 'सातारा' },
  Sindhudurg: { mr: 'सिंधुदुर्ग', hi: 'सिंधुदुर्ग' },
  Solapur: { mr: 'सोलापूर', hi: 'सोलापुर' },
  Thane: { mr: 'ठाणे', hi: 'ठाणे' },
  Wardha: { mr: 'वर्धा', hi: 'वर्धा' },
  Washim: { mr: 'वाशीम', hi: 'वाशीम' },
  Yavatmal: { mr: 'यवतमाळ', hi: 'यवतमाल' },
}

const CATEGORY_TRANSLATIONS: Record<string, { mr: string; hi: string }> = {
  Insurance: { mr: 'विमा', hi: 'बीमा' },
  Credit: { mr: 'कर्ज', hi: 'ऋण' },
  'Direct Benefit': { mr: 'थेट लाभ', hi: 'प्रत्यक्ष लाभ' },
  'Crop Insurance': { mr: 'पीक विमा', hi: 'फसल बीमा' },
  Horticulture: { mr: 'फलोत्पादन', hi: 'बागवानी' },
  General: { mr: 'सामान्य', hi: 'सामान्य' },
  Agriculture: { mr: 'कृषी', hi: 'कृषि' },
  Livestock: { mr: 'पशुधन', hi: 'पशुधन' },
}

const LEVEL_TRANSLATIONS: Record<string, { mr: string; hi: string }> = {
  Central: { mr: 'केंद्र', hi: 'केंद्र' },
  State: { mr: 'राज्य', hi: 'राज्य' },
  District: { mr: 'जिल्हा', hi: 'जिला' },
}

const LITE_TEXT_REPLACEMENTS: Array<[RegExp, { mr: string; hi: string }]> = [
  [/2-month training \(free of cost\)/gi, { mr: '२ महिन्यांचे मोफत प्रशिक्षण', hi: '2 महीने का निःशुल्क प्रशिक्षण' }],
  [/free of cost/gi, { mr: 'मोफत', hi: 'निःशुल्क' }],
  [/no collateral/gi, { mr: 'तारणाची गरज नाही', hi: 'जमानत की आवश्यकता नहीं' }],
  [/open to/gi, { mr: 'यासाठी खुले', hi: 'इनके लिए खुली' }],
  [/up to/gi, { mr: 'पर्यंत', hi: 'तक' }],
  [/bank loans/gi, { mr: 'बँक कर्जे', hi: 'बैंक ऋण' }],
  [/bank loan/gi, { mr: 'बँक कर्ज', hi: 'बैंक ऋण' }],
  [/bank account/gi, { mr: 'बँक खाते', hi: 'बैंक खाता' }],
  [/direct to bank account/gi, { mr: 'थेट बँक खात्यात', hi: 'सीधे बैंक खाते में' }],
  [/per project/gi, { mr: 'प्रति प्रकल्प', hi: 'प्रति परियोजना' }],
  [/primary processing/gi, { mr: 'प्राथमिक प्रक्रिया', hi: 'प्राथमिक प्रसंस्करण' }],
  [/processing plants/gi, { mr: 'प्रक्रिया प्रकल्प', hi: 'प्रसंस्करण संयंत्र' }],
  [/processing/gi, { mr: 'प्रक्रिया', hi: 'प्रसंस्करण' }],
  [/sorting\/grading/gi, { mr: 'वर्गीकरण', hi: 'छंटाई/ग्रेडिंग' }],
  [/cold chains/gi, { mr: 'कोल्ड चेन', hi: 'कोल्ड चेन' }],
  [/pack houses/gi, { mr: 'पॅक हाऊस', hi: 'पैक हाउस' }],
  [/warehouses/gi, { mr: 'गोदामे', hi: 'गोदाम' }],
  [/warehouses/gi, { mr: 'गोदामे', hi: 'गोदाम' }],
  [/warehousing/gi, { mr: 'गोदाम व्यवस्था', hi: 'भंडारण व्यवस्था' }],
  [/silos/gi, { mr: 'सायलो', hi: 'साइलो' }],
  [/e-marketing platforms/gi, { mr: 'ई-मार्केटिंग प्लॅटफॉर्म', hi: 'ई-मार्केटिंग प्लेटफॉर्म' }],
  [/community farming assets/gi, { mr: 'सामुदायिक शेती मालमत्ता', hi: 'सामुदायिक कृषि परिसंपत्तियां' }],
  [/through CGTMSE/gi, { mr: 'CGTMSE मार्फत', hi: 'CGTMSE के माध्यम से' }],
  [/no GST on/gi, { mr: 'यावर GST नाही', hi: 'इस पर GST नहीं' }],
  [/available through/gi, { mr: 'मार्फत उपलब्ध', hi: 'के माध्यम से उपलब्ध' }],
  [/for dairy\/meat\/poultry\/feed processing infrastructure/gi, { mr: 'दुग्ध, मांस, पोल्ट्री आणि खाद्य प्रक्रिया पायाभूत सुविधांसाठी', hi: 'डेयरी, मांस, पोल्ट्री और फीड प्रोसेसिंग इन्फ्रास्ट्रक्चर के लिए' }],
  [/eligible projects/gi, { mr: 'पात्र प्रकल्प', hi: 'पात्र परियोजनाएं' }],
  [/eligible activities/gi, { mr: 'पात्र उपक्रम', hi: 'पात्र गतिविधियां' }],
  [/each entity can take multiple loans for different projects/gi, { mr: 'प्रत्येक घटक वेगवेगळ्या प्रकल्पांसाठी अनेक कर्जे घेऊ शकतो', hi: 'हर इकाई अलग-अलग परियोजनाओं के लिए कई ऋण ले सकती है' }],
  [/min project cost/gi, { mr: 'किमान प्रकल्प खर्च', hi: 'न्यूनतम परियोजना लागत' }],
  [/no upper limit/gi, { mr: 'वरची मर्यादा नाही', hi: 'कोई ऊपरी सीमा नहीं' }],
  [/Atma Nirbhar Bharat initiative/gi, { mr: 'आत्मनिर्भर भारत उपक्रम', hi: 'आत्मनिर्भर भारत पहल' }],
  [/graduates establish agri clinics\/businesses providing extension services/gi, { mr: 'पदवीधरांनी विस्तार सेवा देणाऱ्या कृषी क्लिनिक/व्यवसाय सुरू करणे', hi: 'स्नातकों द्वारा विस्तार सेवाएं देने वाले कृषि क्लिनिक/व्यवसाय स्थापित करना' }],
  [/at MANAGE\/SAUs/gi, { mr: 'MANAGE/SAUs येथे', hi: 'MANAGE/SAUs में' }],
  [/composite subsidy/gi, { mr: 'एकत्रित अनुदान', hi: 'समेकित सब्सिडी' }],
  [/interest subvention/gi, { mr: 'व्याज सवलत', hi: 'ब्याज सब्सिडी' }],
  [/interest subsidy/gi, { mr: 'व्याज सवलत', hi: 'ब्याज सब्सिडी' }],
  [/effective interest rate/gi, { mr: 'प्रभावी व्याजदर', hi: 'प्रभावी ब्याज दर' }],
  [/credit guarantee/gi, { mr: 'क्रेडिट हमी', hi: 'क्रेडिट गारंटी' }],
  [/crop insurance/gi, { mr: 'पीक विमा', hi: 'फसल बीमा' }],
  [/accidental death or permanent disability/gi, { mr: 'अपघाती मृत्यू किंवा कायम अपंगत्व', hi: 'दुर्घटनाजन्य मृत्यु या स्थायी विकलांगता' }],
  [/post-harvest management/gi, { mr: 'पश्चात कापणी व्यवस्थापन', hi: 'कटाई बाद प्रबंधन' }],
  [/post-harvest/gi, { mr: 'पश्चात कापणी', hi: 'कटाई बाद' }],
  [/animal husbandry/gi, { mr: 'पशुसंवर्धन', hi: 'पशुपालन' }],
  [/direct benefit/gi, { mr: 'थेट लाभ', hi: 'प्रत्यक्ष लाभ' }],
  [/per hectare/gi, { mr: 'प्रति हेक्टर', hi: 'प्रति हेक्टेयर' }],
  [/per acre/gi, { mr: 'प्रति एकर', hi: 'प्रति एकड़' }],
  [/per year/gi, { mr: 'दरवर्षी', hi: 'प्रति वर्ष' }],
  [/loan support/gi, { mr: 'कर्ज सहाय्य', hi: 'ऋण सहायता' }],
  [/loan/gi, { mr: 'कर्ज', hi: 'ऋण' }],
  [/loans/gi, { mr: 'कर्जे', hi: 'ऋण' }],
  [/farmers/gi, { mr: 'शेतकरी', hi: 'किसान' }],
  [/farmer/gi, { mr: 'शेतकरी', hi: 'किसान' }],
  [/eligible/gi, { mr: 'पात्र', hi: 'पात्र' }],
  [/activities/gi, { mr: 'उपक्रम', hi: 'गतिविधियां' }],
  [/infrastructure/gi, { mr: 'पायाभूत सुविधा', hi: 'बुनियादी ढांचा' }],
  [/development/gi, { mr: 'विकास', hi: 'विकास' }],
  [/fund/gi, { mr: 'निधी', hi: 'निधि' }],
  [/scheme/gi, { mr: 'योजना', hi: 'योजना' }],
  [/insurance/gi, { mr: 'विमा', hi: 'बीमा' }],
  [/subsidy/gi, { mr: 'अनुदान', hi: 'सब्सिडी' }],
  [/grant/gi, { mr: 'अनुदान', hi: 'अनुदान' }],
  [/support/gi, { mr: 'सहाय्य', hi: 'सहायता' }],
  [/\bfor\b/gi, { mr: 'साठी', hi: 'के लिए' }],
  [/\band\b/gi, { mr: 'आणि', hi: 'और' }],
  [/\bor\b/gi, { mr: 'किंवा', hi: 'या' }],
  [/\bwith\b/gi, { mr: 'सह', hi: 'के साथ' }],
  [/\bon\b/gi, { mr: 'वर', hi: 'पर' }],
  [/\bthrough\b/gi, { mr: 'मार्फत', hi: 'के माध्यम से' }],
]

const WORD_REPLACEMENTS: Record<string, { mr: string; hi: string }> = {
  agri: { mr: 'कृषी', hi: 'कृषि' },
  agriculture: { mr: 'कृषी', hi: 'कृषि' },
  agribusiness: { mr: 'कृषी व्यवसाय', hi: 'कृषि व्यवसाय' },
  clinics: { mr: 'क्लिनिक', hi: 'क्लिनिक' },
  clinic: { mr: 'क्लिनिक', hi: 'क्लिनिक' },
  businesses: { mr: 'व्यवसाय', hi: 'व्यवसाय' },
  business: { mr: 'व्यवसाय', hi: 'व्यवसाय' },
  providing: { mr: 'देणाऱ्या', hi: 'देने वाली' },
  provide: { mr: 'देणे', hi: 'देना' },
  extension: { mr: 'विस्तार', hi: 'विस्तार' },
  services: { mr: 'सेवा', hi: 'सेवाएं' },
  service: { mr: 'सेवा', hi: 'सेवा' },
  training: { mr: 'प्रशिक्षण', hi: 'प्रशिक्षण' },
  composite: { mr: 'एकत्रित', hi: 'समेकित' },
  collateral: { mr: 'तारण', hi: 'जमानत' },
  interest: { mr: 'व्याज', hi: 'ब्याज' },
  subvention: { mr: 'सवलत', hi: 'सब्सिडी' },
  rate: { mr: 'दर', hi: 'दर' },
  credit: { mr: 'क्रेडिट', hi: 'क्रेडिट' },
  guarantee: { mr: 'हमी', hi: 'गारंटी' },
  management: { mr: 'व्यवस्थापन', hi: 'प्रबंधन' },
  community: { mr: 'सामुदायिक', hi: 'सामुदायिक' },
  farming: { mr: 'शेती', hi: 'खेती' },
  assets: { mr: 'मालमत्ता', hi: 'परिसंपत्तियां' },
  projects: { mr: 'प्रकल्प', hi: 'परियोजनाएं' },
  project: { mr: 'प्रकल्प', hi: 'परियोजना' },
  warehouses: { mr: 'गोदामे', hi: 'गोदाम' },
  warehouse: { mr: 'गोदाम', hi: 'गोदाम' },
  silos: { mr: 'सायलो', hi: 'साइलो' },
  silo: { mr: 'सायलो', hi: 'साइलो' },
  cold: { mr: 'कोल्ड', hi: 'कोल्ड' },
  chain: { mr: 'चेन', hi: 'चेन' },
  chains: { mr: 'चेन', hi: 'चेन' },
  pack: { mr: 'पॅक', hi: 'पैक' },
  houses: { mr: 'हाऊस', hi: 'हाउस' },
  house: { mr: 'हाऊस', hi: 'हाउस' },
  processing: { mr: 'प्रक्रिया', hi: 'प्रसंस्करण' },
  primary: { mr: 'प्राथमिक', hi: 'प्राथमिक' },
  units: { mr: 'युनिट्स', hi: 'यूनिट्स' },
  unit: { mr: 'युनिट', hi: 'यूनिट' },
  each: { mr: 'प्रत्येक', hi: 'हर' },
  entity: { mr: 'घटक', hi: 'इकाई' },
  different: { mr: 'वेगवेगळ्या', hi: 'अलग-अलग' },
  gst: { mr: 'GST', hi: 'GST' },
  available: { mr: 'उपलब्ध', hi: 'उपलब्ध' },
  nationwide: { mr: 'देशभर', hi: 'देशभर' },
  sanctioned: { mr: 'मंजूर', hi: 'स्वीकृत' },
  first: { mr: 'पहिल्या', hi: 'पहले' },
  days: { mr: 'दिवसांत', hi: 'दिनों में' },
  dairy: { mr: 'दुग्ध', hi: 'डेयरी' },
  meat: { mr: 'मांस', hi: 'मांस' },
  poultry: { mr: 'पोल्ट्री', hi: 'पोल्ट्री' },
  feed: { mr: 'खाद्य', hi: 'फीड' },
  plants: { mr: 'प्रकल्प', hi: 'संयंत्र' },
  animal: { mr: 'पशु', hi: 'पशु' },
  husbandry: { mr: 'संवर्धन', hi: 'पालन' },
  activities: { mr: 'उपक्रम', hi: 'गतिविधियां' },
  breed: { mr: 'वंश', hi: 'नस्ल' },
  improvement: { mr: 'सुधारणा', hi: 'सुधार' },
  hatcheries: { mr: 'हॅचरी', hi: 'हैचरी' },
  minimum: { mr: 'किमान', hi: 'न्यूनतम' },
  upper: { mr: 'वरची', hi: 'ऊपरी' },
  limit: { mr: 'मर्यादा', hi: 'सीमा' },
  graduates: { mr: 'पदवीधर', hi: 'स्नातक' },
  establish: { mr: 'स्थापन', hi: 'स्थापित' },
  startup: { mr: 'स्टार्टअप', hi: 'स्टार्टअप' },
  startups: { mr: 'स्टार्टअप्स', hi: 'स्टार्टअप्स' },
  women: { mr: 'महिला', hi: 'महिलाएं' },
  hill: { mr: 'डोंगरी', hi: 'पर्वतीय' },
  regions: { mr: 'भाग', hi: 'क्षेत्र' },
  region: { mr: 'भाग', hi: 'क्षेत्र' },
  cost: { mr: 'खर्च', hi: 'लागत' },
  free: { mr: 'मोफत', hi: 'मुफ्त' },
  direct: { mr: 'थेट', hi: 'प्रत्यक्ष' },
  death: { mr: 'मृत्यू', hi: 'मृत्यु' },
  disability: { mr: 'अपंगत्व', hi: 'विकलांगता' },
  permanent: { mr: 'कायम', hi: 'स्थायी' },
  accidental: { mr: 'अपघाती', hi: 'दुर्घटनाजन्य' },
  infrastructure: { mr: 'पायाभूत सुविधा', hi: 'बुनियादी ढांचा' },
  support: { mr: 'सहाय्य', hi: 'सहायता' },
}

const SCHEME_DESCRIPTION_OVERRIDES: Array<{
  match: RegExp
  mr: string
  hi: string
}> = [
  {
    match: /Agri Infrastructure Fund \(AIF\).*Post-Harvest/i,
    mr: 'प्रकल्पासाठी २ कोटी रुपयांपर्यंतच्या कर्जावर ३% व्याज सवलत. शेतकरी, FPOs, सहकारी संस्था, PACS, स्टार्टअप्स आणि SHGs पात्र आहेत. गोदामे, सायलो, कोल्ड चेन, पॅक हाऊस, प्राथमिक प्रक्रिया, अस्सेइंग युनिट्स आणि ई-मार्केटिंग प्लॅटफॉर्म यांसाठी लाभ उपलब्ध आहे. CGTMSE मार्फत १ लाख कोटी रुपयांची क्रेडिट हमी उपलब्ध आहे. प्रत्येक घटक वेगवेगळ्या प्रकल्पांसाठी अनेक कर्जे घेऊ शकतो. व्याज सवलतीवर GST नाही.',
    hi: 'प्रति परियोजना 2 करोड़ रुपये तक के ऋण पर 3% ब्याज सब्सिडी। किसान, FPOs, सहकारी संस्थाएं, PACS, स्टार्टअप्स और SHGs पात्र हैं। गोदाम, साइलो, कोल्ड चेन, पैक हाउस, प्राथमिक प्रसंस्करण, असेइंग यूनिट्स और ई-मार्केटिंग प्लेटफॉर्म के लिए लाभ उपलब्ध है। CGTMSE के माध्यम से 1 लाख करोड़ रुपये की क्रेडिट गारंटी उपलब्ध है। हर इकाई अलग-अलग परियोजनाओं के लिए कई ऋण ले सकती है। ब्याज सब्सिडी पर GST नहीं है.',
  },
  {
    match: /Agriculture Infrastructure Fund \(AIF\)$/i,
    mr: 'पश्चात कापणी व्यवस्थापन आणि सामुदायिक शेती मालमत्तेसाठी १ लाख कोटी रुपयांचा निधी. कर्जावर ३% व्याज सवलत आणि २ कोटी रुपयांपर्यंत CGTMSE क्रेडिट हमी उपलब्ध आहे. गोदामे, कोल्ड चेन, प्रक्रिया, वर्गीकरण, सायलो, पॅक हाऊस आणि प्राथमिक प्रक्रिया प्रकल्प पात्र आहेत. नव्या शासनाच्या पहिल्या १०० दिवसांत देशभरात १०,०६६ प्रकल्प मंजूर झाले. शेतकरी, FPOs, सहकारी संस्था आणि स्टार्टअप्स यांच्यासाठी खुली योजना.',
    hi: 'कटाई बाद प्रबंधन और सामुदायिक कृषि परिसंपत्तियों के लिए 1 लाख करोड़ रुपये का निधि। ऋण पर 3% ब्याज सब्सिडी और 2 करोड़ रुपये तक CGTMSE क्रेडिट गारंटी उपलब्ध है। गोदाम, कोल्ड चेन, प्रसंस्करण, छंटाई/ग्रेडिंग, साइलो, पैक हाउस और प्राथमिक प्रसंस्करण परियोजनाएं पात्र हैं। नई सरकार के पहले 100 दिनों में देशभर में 10,066 परियोजनाएं स्वीकृत हुईं। यह योजना किसानों, FPOs, सहकारी संस्थाओं और स्टार्टअप्स के लिए खुली है.',
  },
  {
    match: /Animal Husbandry Infrastructure Development Fund \(AHIDF\)/i,
    mr: 'दुग्ध, मांस, पोल्ट्री आणि खाद्य प्रक्रिया पायाभूत सुविधांसाठी बँक कर्जावर ३% व्याज सवलत. दुग्ध प्रक्रिया प्रकल्प, मांस प्रक्रिया, पोल्ट्री प्रक्रिया, पशुखाद्य प्रकल्प, वंश सुधारणा आणि कुक्कुट/मत्स्य हॅचरी हे पात्र उपक्रम आहेत. किमान प्रकल्प खर्च १० लाख रुपये असून वरची मर्यादा नाही. CGTMSE मार्फत क्रेडिट हमी आणि १०,००० कोटी रुपयांचा निधी उपलब्ध आहे. हा आत्मनिर्भर भारत उपक्रमाचा भाग आहे.',
    hi: 'डेयरी, मांस, पोल्ट्री और फीड प्रोसेसिंग इन्फ्रास्ट्रक्चर के लिए बैंक ऋण पर 3% ब्याज सब्सिडी। डेयरी प्रोसेसिंग, मांस प्रसंस्करण, पोल्ट्री प्रोसेसिंग, पशु आहार संयंत्र, नस्ल सुधार और पोल्ट्री/मत्स्य हैचरी पात्र गतिविधियां हैं। न्यूनतम परियोजना लागत 10 लाख रुपये है और कोई ऊपरी सीमा नहीं है। CGTMSE के माध्यम से क्रेडिट गारंटी और 10,000 करोड़ रुपये का निधि उपलब्ध है। यह आत्मनिर्भर भारत पहल का हिस्सा है.',
  },
  {
    match: /Krishi Clinic/i,
    mr: 'कृषी पदवीधरांना विस्तार सेवा देणारे कृषी क्लिनिक किंवा व्यवसाय सुरू करण्यासाठी मदत. MANAGE/SAUs येथे २ महिन्यांचे मोफत प्रशिक्षण उपलब्ध आहे. बँक कर्जावर ३६% एकत्रित अनुदान आणि SC/ST/महिला/डोंगरी भागांसाठी ४४% अनुदान. १ लाख रुपयांपर्यंत कर्जासाठी तारणाची गरज नाही.',
    hi: 'कृषि स्नातकों को विस्तार सेवाएं देने वाले कृषि क्लिनिक या व्यवसाय स्थापित करने में सहायता। MANAGE/SAUs में 2 महीने का निःशुल्क प्रशिक्षण उपलब्ध है। बैंक ऋण पर 36% समेकित सब्सिडी और SC/ST/महिला/पर्वतीय क्षेत्रों के लिए 44% सब्सिडी। 1 लाख रुपये तक के ऋण पर जमानत की आवश्यकता नहीं है.',
  },
]

const REWARD_BADGES: Array<{
  match: RegExp
  text: { en: string; mr: string; hi: string }
}> = [
  { match: /interest subvention|interest subsidy|interest rate/i, text: { en: 'Interest subsidy', mr: 'व्याज सवलत', hi: 'ब्याज सब्सिडी' } },
  { match: /credit guarantee|loan|kcc|bank loan/i, text: { en: 'Loan support', mr: 'कर्ज सहाय्य', hi: 'ऋण सहायता' } },
  { match: /insurance|coverage|accident|disability|assurance/i, text: { en: 'Insurance cover', mr: 'विमा संरक्षण', hi: 'बीमा सुरक्षा' } },
  { match: /training|skill|capacity/i, text: { en: 'Skill training', mr: 'कौशल्य प्रशिक्षण', hi: 'कौशल प्रशिक्षण' } },
  { match: /health|medical/i, text: { en: 'Health cover', mr: 'आरोग्य संरक्षण', hi: 'स्वास्थ्य सुरक्षा' } },
  { match: /warehouse|cold chain|storage|processing|infrastructure|fund/i, text: { en: 'Infra support', mr: 'सुविधा सहाय्य', hi: 'इन्फ्रा सहायता' } },
  { match: /service|advisory|guidance|facilitation/i, text: { en: 'Free service', mr: 'मोफत सेवा', hi: 'मुफ्त सेवा' } },
  { match: /market|marketing|e-market/i, text: { en: 'Market support', mr: 'बाजार सहाय्य', hi: 'बाजार सहायता' } },
  { match: /seed|fertilizer|equipment|machinery|tool|input/i, text: { en: 'Input support', mr: 'इनपुट सहाय्य', hi: 'इनपुट सहायता' } },
  { match: /pension/i, text: { en: 'Monthly pension', mr: 'मासिक पेन्शन', hi: 'मासिक पेंशन' } },
  { match: /scholarship|education/i, text: { en: 'Education aid', mr: 'शिक्षण सहाय्य', hi: 'शिक्षा सहायता' } },
]

function formatShortNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 10000000) {
    const num = value / 10000000
    return `${Number(num.toFixed(abs >= 100000000 ? 0 : 1))} Cr`
  }
  if (abs >= 100000) {
    const num = value / 100000
    return `${Number(num.toFixed(abs >= 1000000 ? 0 : 1))} Lakh`
  }
  if (abs >= 1000) {
    const num = value / 1000
    return `${Number(num.toFixed(abs >= 10000 ? 0 : 1))}k`
  }
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)
}

export function resolveAppLang(language: string | null | undefined): UiLang {
  const code = String(language || '').toLowerCase()
  if (code.startsWith('mr')) return 'mr'
  if (code.startsWith('hi')) return 'hi'
  return 'en'
}

export function trByLang(lang: UiLang, en: string, mr: string, hi: string): string {
  return lang === 'mr' ? mr : lang === 'hi' ? hi : en
}

export function formatCompactCurrency(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0
  return `₹${formatShortNumber(safe)}`
}

export function localizeCategory(value: string, lang: UiLang): string {
  const key = String(value || '').trim()
  const match = CATEGORY_TRANSLATIONS[key]
  return match ? trByLang(lang, key, match.mr, match.hi) : key
}

export function localizeLevel(value: string, lang: UiLang): string {
  const key = String(value || '').trim()
  const match = LEVEL_TRANSLATIONS[key]
  return match ? trByLang(lang, key, match.mr, match.hi) : key
}

export function localizeDistrict(value: string, lang: UiLang): string {
  const key = String(value || '').trim()
  const match = DISTRICT_TRANSLATIONS[key]
  return match ? trByLang(lang, key, match.mr, match.hi) : key
}

export function translateLite(text: string, lang: UiLang): string {
  if (lang === 'en') return String(text || '')
  const phraseTranslated = LITE_TEXT_REPLACEMENTS.reduce((acc, [pattern, replacement]) => {
    return acc.replace(pattern, lang === 'mr' ? replacement.mr : replacement.hi)
  }, String(text || ''))
  return phraseTranslated.replace(/\b[A-Za-z][A-Za-z/-]*\b/g, (token) => {
    const replacement = WORD_REPLACEMENTS[token.toLowerCase()]
    return replacement ? (lang === 'mr' ? replacement.mr : replacement.hi) : token
  })
}

export function localizeSchemeTitle(name: string, marathiName: string, lang: UiLang): string {
  if (lang === 'en') return name
  if (lang === 'mr') return marathiName || translateLite(name, 'mr')
  return translateLite(name, 'hi')
}

export function localizeSchemeBenefit(benefit: string, lang: UiLang, schemeName = ''): string {
  if (lang === 'en') return String(benefit || '')
  const override = SCHEME_DESCRIPTION_OVERRIDES.find((entry) => entry.match.test(String(schemeName || '')))
  if (override) {
    return lang === 'mr' ? override.mr : override.hi
  }
  return translateLite(benefit, lang)
}

export function getLocalizedApmcName(name: string, marathiName: string | undefined, lang: UiLang): string {
  if (lang === 'en') return name
  return marathiName || name
}

export function localizeRouteStop(stop: string, lang: UiLang): string {
  const raw = String(stop || '')
  if (!raw) return raw
  return raw
    .replace(/Farm Start/gi, trByLang(lang, 'Farm Start', 'शेत प्रारंभ', 'खेत प्रारंभ'))
    .replace(/\bAPMC\b/gi, trByLang(lang, 'APMC', 'एपीएमसी', 'एपीएमसी'))
}

function isIndirectBenefit(amount: number, text: string): boolean {
  if (!amount || amount <= 0) return true
  if (amount >= 10000000) return true
  return /interest subvention|interest subsidy|credit guarantee|fund|corpus|loan|per project|up to rs ?\d+\s*crore|crore fund|infrastructure/i.test(text)
}

export function getSchemeBenefitDisplay(
  scheme: SchemeLike,
  lang: UiLang,
): { kind: 'amount' | 'badge'; text: string } {
  const amount = Number(scheme.amount || 0)
  const text = `${scheme.name || ''} ${scheme.benefit || ''}`.trim()

  if (!isIndirectBenefit(amount, text)) {
    return { kind: 'amount', text: formatCompactCurrency(amount) }
  }

  const badge = REWARD_BADGES.find((entry) => entry.match.test(text))
  if (badge) {
    return { kind: 'badge', text: trByLang(lang, badge.text.en, badge.text.mr, badge.text.hi) }
  }

  return {
    kind: 'badge',
    text: trByLang(lang, 'Scheme benefit', 'योजना लाभ', 'योजना लाभ'),
  }
}
