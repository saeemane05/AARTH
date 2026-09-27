import requests
from bs4 import BeautifulSoup
import pandas as pd
import unicodedata
from datetime import datetime, date
from threading import Lock
import time

try:
    from .travel_expense import nearby_apmcs_with_transport_cost
except ImportError:
    from travel_expense import nearby_apmcs_with_transport_cost

BASE      = "https://www.msamb.com/ApmcDetail"
MAIN_PAGE = f"{BASE}/APMCPriceInformation"
REQUEST_TIMEOUT = (3, 7)  # (connect_timeout, read_timeout)
HTTP_RETRIES = 2
RETRY_BACKOFF_SEC = 0.35
PRICE_CACHE_TTL_SEC = 15 * 60

_PRICE_CACHE = {}
_PRICE_CACHE_LOCK = Lock()

# Exact headers that work (confirmed by debug_parser.py)
HEADERS = {
    "User-Agent":       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept":           "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language":  "en-US,en;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
    "Referer":          MAIN_PAGE,
    "Connection":       "keep-alive",
}

# MSAMB code → Marathi name in DataGridBind response (from apmc_master.py)
MSAMB_CODE_TO_MR = {
    "001":   "अकलुज",
    "010":   "अकोला",
    "01001": "अकोला (बोरगावमंजू)",
    "030":   "अकोले",
    "079":   "अचलपूर",
    "080":   "अजनगाव सुर्जी",
    "012":   "अमरावती",
    "01201": "अमरावती- फळ आणि भाजीपाला",
    "061":   "अमळनेर",
    "127":   "अलिबाग",
    "007":   "अहिल्यानगर",
    "178":   "आंबेजोबाई",
    "163":   "आटपाडी",
    "046":   "आरमोरी",
    "027":   "आर्वी",
    "269":   "आष्टी (वर्धा)",
    "103":   "इंदापूर",
    "101":   "इस्लामपूर",
    "139":   "उल्हासनगर",
    "058":   "उमरेड",
    "185":   "औसा",
    "188":   "औराद शहाजानी",
    "048":   "बीड",
    "231":   "बुलढाणा",
    "039":   "चंद्रपूर",
    "03901": "चंद्रपूर - गंजवड",
    "065":   "चांदवड",
    "118":   "चांदूर बझार",
    "222":   "चांदूर-रल्वे.",
    "028":   "चिखली",
    "252":   "चिमुर",
    "025":   "चोपडा",
    "035":   "छत्रपती संभाजीनगर",
    "016":   "जळगाव",
    "01601": "जळगाव - मसावत",
    "009":   "जालना",
    "089":   "जामखेड",
    "296":   "जाफराबाद",
    "279":   "जावळी",
    "076":   "जिंतूर",
    "033":   "जुन्नर",
    "03302": "जुन्नर - नारायणगाव",
    "03303": "जुन्नर -आळेफाटा",
    "03301": "जुन्नर -ओतूर",
    "03304": "जुन्नर -बेल्हे",
    "146":   "तळोदा",
    "164":   "तासगाव",
    "248":   "तिरोडा",
    "125":   "तुमसर",
    "207":   "तुळजापूर",
    "156":   "दिंडोरी",
    "15601": "दिंडोरी-वणी",
    "014":   "धुळे",
    "018":   "धाराशिव",
    "040":   "नंदुरबार",
    "155":   "नांदगाव",
    "228":   "नांदुरा",
    "036":   "नांदेड",
    "034":   "नागपूर",
    "307":   "नामपूर",
    "30701": "नामपूर- करंजाड",
    "011":   "नाशिक",
    "01101": "नाशिक - देवळाली",
    "093":   "नेवासा",
    "09301": "नेवासा -घोडेगाव",
    "029":   "पंढरपूर",
    "043":   "पनवेल",
    "112":   "परतूर",
    "021":   "परभणी",
    "110":   "परळी-वैजनाथ",
    "206":   "परांडा",
    "278":   "पलूस",
    "044":   "पवनी",
    "064":   "पाचोरा",
    "06401": "पाचोरा- भदगाव",
    "055":   "पाटन",
    "221":   "पातूर",
    "143":   "पाथर्डी",
    "142":   "पारनेर",
    "268":   "पारशिवनी",
    "152":   "पारोळा",
    "096":   "पिंपळगाव बसवंत",
    "09601": "पिंपळगाव(ब) - सायखेडा",
    "09602": "पिंपळगाव(ब) - पालखेड",
    "09604": "पिंपळगाव(ब) - औरंगपूर भेंडाळी",
    "022":   "पुणे",
    "02201": "पुणे- खडकी",
    "02202": "पुणे -पिंपरी",
    "02204": "पुणे-मांजरी",
    "02205": "पुणे-मोशी",
    "106":   "फलटण",
    "004":   "बारामती",
    "00402": "बारामती-जळोची",
    "00401": "बारामती-सुपे",
    "031":   "बार्शी",
    "218":   "बार्शी - टाकळी",
    "03101": "बार्शी -वैराग",
    "217":   "बाळापूर",
    "082":   "खामगाव",
    "067":   "खेड",
    "06701": "खेड-चाकण",
    "107":   "करमाळा",
    "105":   "कराड",
    "141":   "कर्जत (अहमहदनगर)",
    "14102": "कर्जत- (मिरजगाव)",
    "244":   "कर्जत (रायगड)",
    "14101": "कर्जत- (राशिन)",
    "102":   "कल्याण",
    "053":   "कळवण",
    "263":   "कळमेश्वर",
    "264":   "काटोल",
    "294":   "कामठी",
    "077":   "कारंजा",
    "179":   "किल्ले धारुर",
    "171":   "कुर्डवाडी",
    "17101": "कुर्डवाडी-मोडनिंब",
    "182":   "केज",
    "091":   "कोपरगाव",
    "002":   "कोल्हापूर",
    "00201": "कोल्हापूर -लश्र्मीपूरी",
    "154":   "घोटी",
    "174":   "गंगापूर",
    "113":   "गंगाखेड",
    "013":   "गडचिरोली",
    "109":   "गेवराई",
    "054":   "गोंदिया",
    "250":   "गोरेगांव",
    "235":   "घाटंजी",
    "015":   "लासलगाव",
    "01501": "लासलगाव - निफाड",
    "01502": "लासलगाव - विंचूर",
    "108":   "लासूर स्टेशन",
    "069":   "लोणंद",
    "122":   "लोणार",
    "193":   "लोहा",
    "005":   "लातूर",
    "00501": "लातूर -मुरुड",
    "066":   "मनमाड",
    "083":   "मलकापूर",
    "024":   "मालेगाव",
    "02402": "मालेगाव-मुंगसे",
    "050":   "मुंबई",
    "05002": "मुंबई - फ्रुट मार्केट",
    "05003": "मुंबई - कांदा बटाटा मार्केट",
    "135":   "मुरबाड",
    "131":   "मुरुड",
    "205":   "मुरुम",
    "078":   "मुर्तीजापूर",
    "253":   "मुल",
    "123":   "मेहकर",
    "173":   "मोहोळ",
    "068":   "मंचर",
    "06801": "मंचर- वणी",
    "183":   "मंठा",
    "219":   "मंगरुळपीर",
    "172":   "मंगळवेढा",
    "019":   "यवतमाळ",
    "008":   "येवला",
    "00801": "येवला -आंदरसूल",
    "052":   "रत्नागिरी",
    "255":   "राजूरा",
    "267":   "रामटेक",
    "241":   "राळेगाव",
    "104":   "रावेर",
    "290":   "राहता",
    "042":   "राहुरी",
    "04201": "राहुरी -वांबोरी",
    "116":   "रिसोड",
    "133":   "रोहा",
    "145":   "साक्री",
    "272":   "समुद्रपूर",
    "060":   "संगमनेर",
    "017":   "सांगली",
    "01701": "सांगली -फळे भाजीपाला",
    "01702": "सांगली -मिरज",
    "070":   "सांगोला",
    "168":   "सातारा",
    "088":   "सावनेर",
    "259":   "सावली",
    "041":   "सिन्नर",
    "04101": "सिन्नर- नांदूर शिंगोटे",
    "04103": "सिन्नर - नायगाव",
    "04106": "सिन्नर - वडांगळी",
    "04107": "सिन्नर - हिवरगांव",
    "071":   "सिल्लोड",
    "07101": "सिल्लोड- भराडी",
    "256":   "सिंदेवाही",
    "271":   "सिंदी",
    "27101": "सिंदी(सेलू)",
    "115":   "सेलु",
    "211":   "सेनगाव",
    "287":   "सोनपेठ",
    "003":   "सोलापूर",
    "075":   "हिंगोली",
    "07501": "हिंगोली- खानेगाव नाका",
    "038":   "हिंगणघाट",
    "190":   "हादगाव",
    "19001": "हादगाव-तामसा",
    "062":   "चाळीसगाव",
    "06201": "चाळीसगाव-नागदरोड",
    "187":   "चाकूर",
    "261":   "चार्मोशी",
    "149":   "भुसावळ",
    "158":   "भोर",
    "072":   "भोकरदन",
    "151":   "धरणगाव",
    "090":   "सटाणा",
    "094":   "श्रीगोंदा",
    "095":   "श्रीरामपूर",
    "09501": "श्रीरामपूर - बेलापूर",
    "098":   "शेवगाव",
    "09801": "शेवगाव - भोदेगाव",
    "085":   "वणी",
    "08501": "वनी-शिंदोला",
    "120":   "वरूड",
    "12001": "वरूड-राजूरा बझार",
    "126":   "वरोरा",
    "12601": "वरोरा-माढेली",
    "12602": "वरोरा-शेगाव",
    "12603": "वरोरा-खांबाडा",
    "063":   "वर्धा",
    "138":   "वसई",
    "170":   "वाई",
    "049":   "वाशीम",
    "04901": "वाशीम - अनसींग",
    "177":   "वैजापूर",
    "17701": "वैजापूर- शिऊर",
    "020":   "शहादा",
    "137":   "शहापूर",
    "099":   "शिरपूर",
    "161":   "शिरुर",
    "16103": "शिरुर-कांदा मार्केट",
    "230":   "शेगाव",
    "097":   "वडगाव पेठ",
    "292":   "वडवणी",
    "169":   "वडूज",
    "196":   "नायगाव",
    "160":   "निरा",
    "186":   "निलंगा",
    "239":   "नेर परसोपंत",
    "159":   "दौंड",
    "15901": "दौंड-केडगाव",
    "15902": "दौंड-यवत",
    "15903": "दौंड-पाटस",
    "251":   "ब्रम्हपूरी",
    "245":   "भंडारा",
    "258":   "भद्रावती",
    "134":   "भिवंडी",
    "262":   "भिवापूर",
    "254":   "नागभिड",
    "257":   "गोंडपिंपरी",
    "270":   "पुलगाव",
    "247":   "लाखणी",
    "243":   "बाभुळगाव",
    "233":   "बोरी-अरब",
    "121":   "देउळगाव राजा",
    "298":   "देवणी",
    "286":   "देवळा",
    "130":   "मानगाव (भादव)",
    "132":   "पेन",
    "129":   "महड",
    "136":   "पालघर (बेवूर)",
    "216":   "पालम",
    "191":   "कंधार",
    "175":   "कन्न्ड",
    "310":   "बदनापूर",
    "210":   "बसमत",
    "299":   "पोम्भुर्नी",
    "282":   "कळंब (यवतमाळ)",
    "283":   "आर्णी",
    "242":   "उमरखेड",
    "24201": "उमरखेड-डांकी",
    "006":   "धर्माबाद",
    "059":   "धामणगाव -रेल्वे",
    "117":   "तेल्हारा",
}


def _normalize_code(raw):
    """'11.0' → '011', '96.0' → '096', '156.0' → '156'"""
    s = str(raw).strip()
    if s.endswith(".0"):
        s = s[:-2]
    return s.zfill(3)


def _parse_dt(date_str):
    try:
        return datetime.strptime(date_str.strip(), "%d/%m/%Y")
    except Exception:
        return datetime.min


def _session_get_with_retry(
    session,
    url,
    headers=None,
    timeout=REQUEST_TIMEOUT,
    retries=HTTP_RETRIES,
    backoff_sec=RETRY_BACKOFF_SEC,
):
    last_error = None

    for attempt in range(1, retries + 1):
        try:
            return session.get(url, headers=headers, timeout=timeout)
        except requests.exceptions.RequestException as exc:
            last_error = exc
            if attempt < retries:
                wait = backoff_sec * attempt
                print(f"  ⚠ Network retry {attempt}/{retries - 1} in {wait:.1f}s...")
                time.sleep(wait)

    raise RuntimeError(
        f"Unable to reach MSAMB after {retries} attempts. "
        f"Please check internet/VPN/firewall and try again. Last error: {last_error}"
    ) from last_error


def fetch_all_apmc_prices(session, commodity_code):
    """
    Single call: DataGridBind?commodityCode=X&apmcCode=null
    Returns dict: { marathi_name → {Modal Price, Min Price, Max Price, Date} }

    For each APMC, picks the MOST RECENT date available (not necessarily today).
    If an APMC has data on multiple dates, the most recent date's best modal
    price is used. The date is stored so the farmer can see how fresh the data is.
    """
    url = f"{BASE}/DataGridBind?commodityCode={commodity_code}&apmcCode=null"
    r = _session_get_with_retry(session, url, headers=HEADERS)

    if r.status_code != 200:
        raise RuntimeError(f"DataGridBind returned HTTP {r.status_code}")

    soup = BeautifulSoup(r.text, "html.parser")
    rows = soup.find_all("tr")

    # Collect ALL rows grouped by (market_name, date)
    # Structure: { market_name: { date_str: [modal, ...] } }
    all_data = {}   # market_mr → { date_str → {"min","max","modal" lists} }
    current_date = None

    for row in rows:
        cells  = row.find_all("td")
        values = [c.get_text(strip=True) for c in cells]

        if len(values) == 1 and "/" in values[0]:
            current_date = values[0].strip()
            continue

        if len(values) == 7 and current_date:
            market_mr = values[0].strip()
            try:
                modal = float(values[6].replace(",", ""))
                mn    = float(values[4].replace(",", ""))
                mx    = float(values[5].replace(",", ""))
            except ValueError:
                continue

            if market_mr not in all_data:
                all_data[market_mr] = {}
            if current_date not in all_data[market_mr]:
                all_data[market_mr][current_date] = []
            all_data[market_mr][current_date].append((mn, mx, modal))

    # For each APMC: pick most recent date, best modal price on that date
    prices = {}
    for market_mr, date_dict in all_data.items():
        # Most recent date for this specific APMC
        latest_date = max(date_dict.keys(), key=_parse_dt)
        entries     = date_dict[latest_date]
        # Best modal price on that date
        best        = max(entries, key=lambda x: x[2])
        prices[market_mr] = {
            "Modal Price": best[2],
            "Min Price":   best[0],
            "Max Price":   best[1],
            "Date":        latest_date,
        }

    return prices


def _get_cached_prices(commodity_code):
    now = time.time()
    with _PRICE_CACHE_LOCK:
        entry = _PRICE_CACHE.get(str(commodity_code))
        if not entry:
            return None
        if (now - entry["ts"]) > PRICE_CACHE_TTL_SEC:
            _PRICE_CACHE.pop(str(commodity_code), None)
            return None
        return entry["prices"]


def _set_cached_prices(commodity_code, prices):
    with _PRICE_CACHE_LOCK:
        _PRICE_CACHE[str(commodity_code)] = {
            "ts": time.time(),
            "prices": prices,
        }


crop_master = {
    "fig": {"mr": "अंजीर", "code": "07003"},
    "fig_dry": {"mr": "अंजीर (सुके)", "code": "10027"},
    "ambadi_leaves": {"mr": "अंबाडी भाजी", "code": "08003"},
    "pineapple": {"mr": "अननस", "code": "07002"},
    "taro": {"mr": "अर्वी", "code": "08005"},
    "avocado": {"mr": "अवाकाडो", "code": "18008"},
    "aster": {"mr": "अस्टर", "code": "16001"},
    "sorrel_leaves": {"mr": "आंबट चुका", "code": "08004"},
    "mango": {"mr": "आंबा", "code": "07001"},
    "iceberg_lettuce": {"mr": "आईसबर्ग", "code": "18003"},
    "ginger": {"mr": "आले", "code": "08002"},
    "dry_ginger": {"mr": "आले (सुंठ)", "code": "10001"},
    "amla": {"mr": "आवळा", "code": "07042"},
    "black_gram": {"mr": "उडीद", "code": "03022"},
    "black_gram_dal": {"mr": "उडीद डाळ", "code": "03023"},
    "sugarcane": {"mr": "उस", "code": "06003"},
    "castor": {"mr": "एरंडी", "code": "04005"},
    "carom": {"mr": "ओवा", "code": "04014"},
    "yam": {"mr": "कंद", "code": "08034"},
    "curry_leaves": {"mr": "कढिपत्ता", "code": "08031"},
    "safflower": {"mr": "करडई", "code": "04008"},
    "safflower_leaves": {"mr": "करडई (भाजी)", "code": "08038"},
    "watermelon": {"mr": "कलिंगड", "code": "07011"},
    "onion": {"mr": "कांदा", "code": "08035"},
    "onion_leaves": {"mr": "कांदा पात", "code": "08036"},
    "cucumber": {"mr": "काकडी", "code": "08033"},
    "bottle_gourd": {"mr": "कागडा", "code": "16015"},
    "cashew": {"mr": "काजू", "code": "10010"},
    "cotton": {"mr": "कापूस", "code": "01001"},
    "bitter_gourd": {"mr": "कारली", "code": "08039"},
    "carnation": {"mr": "कार्नेशन", "code": "16035"},
    "raw_mango": {"mr": "कालवड", "code": "09020"},
    "horse_gram": {"mr": "कुलथी", "code": "03010"},
    "banana": {"mr": "केळी", "code": "07014"},
    "raw_banana": {"mr": "केळी (कच्ची)", "code": "08040"},
    "kairi": {"mr": "कैरी", "code": "08032"},
    "coriander": {"mr": "कोथिंबिर", "code": "08044"},
    "cabbage": {"mr": "कोबी", "code": "08041"},
    "pumpkin": {"mr": "कोहळा", "code": "08043"},
    "khapli_wheat": {"mr": "खपली", "code": "02012"},
    "muskmelon": {"mr": "खरबुज", "code": "07044"},
    "cluster_beans": {"mr": "गवार", "code": "08024"},
    "wheat": {"mr": "गहू", "code": "02009"},
    "carrot": {"mr": "गाजर", "code": "08022"},
    "rose": {"mr": "गुलाब", "code": "16003"},
    "jaggery": {"mr": "गुळ", "code": "06001"},
    "gladiolus": {"mr": "ग्लॅडीओ", "code": "16025"},
    "beans": {"mr": "घेवडा", "code": "08025"},
    "beans_seed": {"mr": "घेवडा बी", "code": "03005"},
    "ridge_gourd": {"mr": "घोसाळी (भाजी)", "code": "08026"},
    "cowpea_leaves": {"mr": "चवळी (पाला)", "code": "08016"},
    "cowpea_pods": {"mr": "चवळी (शेंगा)", "code": "08015"},
    "cowpea_seed": {"mr": "चवळी बी", "code": "03003"},
    "chickoo": {"mr": "चिकु", "code": "07006"},
    "cherry_tomato": {"mr": "चेरी टोमॅटो", "code": "18011"},
    "cumin": {"mr": "जिरे", "code": "10009"},
    "jowar": {"mr": "ज्वारी", "code": "02011"},
    "zucchini": {"mr": "झुचीनी", "code": "18010"},
    "marigold": {"mr": "झेंडू", "code": "16009"},
    "tomato": {"mr": "टोमॅटो", "code": "08071"},
    "pomegranate": {"mr": "डाळींब", "code": "07007"},
    "capsicum": {"mr": "ढोवळी मिरची", "code": "08049"},
    "rice": {"mr": "तांदूळ", "code": "02023"},
    "sesame": {"mr": "तील", "code": "04019"},
    "tur": {"mr": "तूर", "code": "03020"},
    "tur_dal": {"mr": "तूर डाळ", "code": "03021"},
    "ivy_gourd": {"mr": "तोंडली", "code": "08072"},
    "cinnamon": {"mr": "दालचिनी", "code": "10022"},
    "bottle_gourd_alt": {"mr": "दुधी भोपळा", "code": "08012"},
    "grapes": {"mr": "द्राक्ष", "code": "07008"},
    "coriander_seed": {"mr": "धने", "code": "10005"},
    "ragi": {"mr": "नाचणी/ नागली", "code": "02016"},
    "coconut": {"mr": "नारळ", "code": "04013"},
    "snake_gourd": {"mr": "पडवळ", "code": "08054"},
    "papaya": {"mr": "पपई", "code": "07018"},
    "spinach": {"mr": "पालक", "code": "08055"},
    "mint": {"mr": "पुदिना", "code": "08060"},
    "pear": {"mr": "पेअर", "code": "07019"},
    "guava": {"mr": "पेरु", "code": "07020"},
    "plum": {"mr": "प्लम", "code": "07024"},
    "jackfruit": {"mr": "फणस", "code": "07022"},
    "cauliflower": {"mr": "फ्लॉवर", "code": "08021"},
    "potato": {"mr": "बटाटा", "code": "08007"},
    "fennel": {"mr": "बडिशेप", "code": "04002"},
    "almond": {"mr": "बदाम", "code": "10023"},
    "bajra": {"mr": "बाजरी", "code": "02002"},
    "beetroot": {"mr": "बीट", "code": "08008"},
    "raisins": {"mr": "बेदाणा", "code": "10025"},
    "baby_corn": {"mr": "बेबी कॉर्न", "code": "18009"},
    "ber": {"mr": "बोर", "code": "07004"},
    "broccoli": {"mr": "ब्रोकोली", "code": "18004"},
    "paddy": {"mr": "भात - धान", "code": "02007"},
    "groundnut_green": {"mr": "भुईमुग शेंग (ओली)", "code": "08085"},
    "groundnut_dry": {"mr": "भुईमुग शेंग (सुकी)", "code": "04003"},
    "okra": {"mr": "भेडी", "code": "08009"},
    "maize": {"mr": "मका", "code": "02015"},
    "peas": {"mr": "मटार", "code": "08074"},
    "lentil": {"mr": "मसूर", "code": "03012"},
    "lentil_dal": {"mr": "मसूर डाळ", "code": "03013"},
    "red_chilli": {"mr": "मिरची (लाल)", "code": "10014"},
    "green_chilli": {"mr": "मिरची (हिरवी)", "code": "10013"},
    "black_pepper": {"mr": "मिरे", "code": "10020"},
    "radish": {"mr": "मुळा", "code": "08051"},
    "green_gram": {"mr": "मूग", "code": "03016"},
    "green_gram_dal": {"mr": "मूग डाळ", "code": "03017"},
    "fenugreek_seed": {"mr": "मेथी बी", "code": "10012"},
    "fenugreek_leaves": {"mr": "मेथी भाजी", "code": "08048"},
    "jasmine": {"mr": "मोगरा", "code": "16014"},
    "sweet_lime": {"mr": "मोसंबी", "code": "07016"},
    "mustard": {"mr": "मोहरी", "code": "10015"},
    "sweet_potato": {"mr": "रताळी", "code": "08063"},
    "amaranth": {"mr": "राजगिरा", "code": "03019"},
    "custard_apple": {"mr": "रामफळ", "code": "07025"},
    "garlic": {"mr": "लसूण", "code": "08045"},
    "dry_garlic": {"mr": "लसूण (सुका)", "code": "10011"},
    "lemon": {"mr": "लिंबू", "code": "07015"},
    "brinjal": {"mr": "वांगी", "code": "08078"},
    "peas_dry": {"mr": "वाटाणा", "code": "03025"},
    "cardamom": {"mr": "वेलची", "code": "10018"},
    "coconut_water": {"mr": "शहाळे", "code": "07047"},
    "groundnut": {"mr": "शेंगदाणे", "code": "04016"},
    "dill": {"mr": "शेपू", "code": "08066"},
    "chrysanthemum": {"mr": "शेवंती", "code": "16007"},
    "drumstick": {"mr": "शेवगा", "code": "08067"},
    "orange": {"mr": "संत्री", "code": "07027"},
    "apple": {"mr": "सफरचंद", "code": "07026"},
    "mustard_seed": {"mr": "सरसव", "code": "02021"},
    "sugar": {"mr": "साखर", "code": "06002"},
    "sago": {"mr": "साबुदाणा", "code": "02006"},
    "custard_apple_alt": {"mr": "सिताफळ", "code": "07028"},
    "betel_nut": {"mr": "सुपारी", "code": "10017"},
    "yam_elephant": {"mr": "सुरण", "code": "08069"},
    "sunflower": {"mr": "सुर्यफुल", "code": "04018"},
    "salad": {"mr": "सॅलड", "code": "08064"},
    "soybean": {"mr": "सोयाबिन", "code": "04017"},
    "strawberry": {"mr": "स्ट्रॉबेरी", "code": "07029"},
    "chickpea": {"mr": "हरभरा", "code": "03006"},
    "chickpea_dal": {"mr": "हरभरा डाळ", "code": "03007"},
    "turmeric": {"mr": "हळद/ हळकुंड", "code": "10006"},
}


def fetch_msamb_data(
    crop_en,
    apmc_df=None,
    farmer_lat=None,
    farmer_lon=None,
    vehicle_type=None,
    ownership=None,
    mileage_kmpl=None,
    fuel_type=None,
    rent_per_km=None,
    top_n=20
):
    crop_en = crop_en.lower().strip()
    if crop_en not in crop_master:
        raise ValueError(f"Crop '{crop_en}' not supported")

    crop_info      = crop_master[crop_en]
    commodity_code = crop_info["code"]
    crop_mr        = crop_info["mr"]

    print("🔄 Using Commodity Code:", commodity_code)

    if apmc_df is None:
        apmc_df = nearby_apmcs_with_transport_cost(
            farmer_lat=farmer_lat,
            farmer_lon=farmer_lon,
            vehicle_type=vehicle_type,
            ownership=ownership,
            mileage_kmpl=mileage_kmpl,
            fuel_type=fuel_type,
            rent_per_km=rent_per_km,
            top_n=top_n
        )

    all_prices = _get_cached_prices(commodity_code)

    if all_prices is None:
        # Init session — same pattern confirmed working in debug_parser.py
        session = requests.Session()
        try:
            _session_get_with_retry(session, MAIN_PAGE, headers=HEADERS)
            time.sleep(0.5)

            print("\n🔄 Fetching individual APMC prices...\n")
            all_prices = fetch_all_apmc_prices(session, commodity_code)
        finally:
            session.close()

        if all_prices:
            _set_cached_prices(commodity_code, all_prices)
    else:
        print(f"\n⚡ Using cached APMC prices for commodity {commodity_code}\n")

    if not all_prices:
        raise RuntimeError("DataGridBind returned no price data.")

    print(f"  ✓ Loaded prices for {len(all_prices)} APMCs\n")

    final_rows = []

    for _, apmc in apmc_df.iterrows():
        msamb_code = _normalize_code(apmc["apmc_code"])
        apmc_name  = apmc["apmc_name"]
        market_mr  = MSAMB_CODE_TO_MR.get(msamb_code)

        if market_mr is None:
            print(f"  ⚠ No mapping for {apmc_name} ({msamb_code})")
            continue

        price_info = all_prices.get(market_mr)

        if price_info is None:
            print(f"  ℹ {apmc_name} — no data available")
            continue

        # Flag stale data (older than today)
        data_date  = _parse_dt(price_info["Date"])
        today      = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        if data_date == datetime.min:
            date_label = f"{price_info['Date']} (age unknown)"
        else:
            days_old = (today - data_date).days
            if days_old <= 0:
                age_label = "today"
            elif days_old == 1:
                age_label = "1d old"
            else:
                age_label = f"{days_old}d old"

            if days_old > 1:  # 1d old is normal — markets report previous day prices
                date_label = f"{price_info['Date']} ⚠ ({age_label})"
            else:
                date_label = f"{price_info['Date']} ({age_label})"

        final_rows.append({
            "apmc_code":   msamb_code,
            "apmc_name":   apmc_name,
            "Min Price":   price_info["Min Price"],
            "Max Price":   price_info["Max Price"],
            "Modal Price": price_info["Modal Price"],
            "Date":        date_label,
        })

    result_df = pd.DataFrame(final_rows)

    if result_df.empty:
        raise RuntimeError(
            "No price data matched for nearby APMCs.\n"
            "This crop may not have had any arrivals at nearby markets recently."
        )

    result_df["crop"]       = crop_mr
    result_df["fetch_date"] = date.today()
    return result_df


if __name__ == "__main__":
    print("\n🌾 SEVA – Individual APMC Market Rates\n")
    df = fetch_msamb_data(
        crop_en="onion",
        farmer_lat=20.029257,
        farmer_lon=73.784904,
        vehicle_type="tractor",
        ownership="own",
        mileage_kmpl=5,
        fuel_type="diesel"
    )
    print("\n📊 INDIVIDUAL APMC PRICES (most recent available):\n")
    for _, row in df.iterrows():
        print(
            f"{row['apmc_name']:<25} | "
            f"₹{int(row['Min Price']):>5} – ₹{int(row['Max Price']):>5} | "
            f"Modal: ₹{int(row['Modal Price']):>5} | {row['Date']}"
        )
