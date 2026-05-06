import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const countries = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "Japan", "Singapore", "United Arab Emirates",
  "South Africa", "Brazil", "India", "China","Italy","Russia","South Korea","Spain","Mexico","Indonesia","Netherlands","Saudi Arabia","Turkey","Switzerland","Poland","Sweden","Belgium","Argentina","Israel","Austria","Thailand","Norway","Philippines","Bangladesh","Vietnam","Malaysia","Denmark","Colombia","South Africa","Ireland","Finland","Portugal","Chile","Egypt","Nigeria","Pakistan","Afghanistan","Albania","Algeria","Andorra","Angola","Armenia","Azerbaijan","Bahamas","Bahrain","Barbados","Belarus","Belize","Benin","Bhutan","Bolivia",
"Bosnia and Herzegovina","Botswana","Brunei","Bulgaria","Burkina Faso","Burundi",
"Cambodia","Cameroon","Cape Verde","Central African Republic","Chad",
"Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
"Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
"Fiji","Finland","Gabon","Gambia","Georgia","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
"Haiti","Honduras","Hungary","Iceland","Iran","Iraq","Ireland","Israel",
"Jamaica","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
"Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
"Madagascar","Malawi","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
"Namibia","Nauru","Nepal","New Zealand","Nicaragua","Niger","North Korea","North Macedonia",
"Oman","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Portugal",
"Qatar","Romania","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Senegal","Serbia","Seychelles","Sierra Leone","Slovakia","Slovenia","Solomon Islands","Somalia","South Sudan","Sri Lanka","Sudan","Suriname",
"Taiwan","Tajikistan","Tanzania","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkmenistan","Tuvalu",
"Uganda","Ukraine","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Yemen","Zambia","Zimbabwe","others"]

const currencies = ["USD", "EUR", "GBP", "AUD", "CAD", "JPY", "SGD", "AED", "BRL","ZAR", "INR","AFN-Afghan Afghani-؋","ALL-Albanian Lek-L","AMD-Armenian Dram-֏","ANG-Netherlands Antillean Guilder-ƒ","AOA-Angolan Kwanza-Kz","ARS-Argentine Peso-$","AWG-Aruban Florin-ƒ","AZN-Azerbaijani Manat-₼",
"BAM-Bosnia-Herzegovina Convertible Mark-KM","BBD-Barbadian Dollar-$","BDT-Bangladeshi Taka-৳","BGN-Bulgarian Lev-лв","BHD-Bahraini Dinar-.د.ب","BIF-Burundian Franc-FBu","BMD-Bermudian Dollar-$","BND-Brunei Dollar-$","BOB-Bolivian Boliviano-Bs","BOV-Bolivian Mvdol-BOV","BSD-Bahamian Dollar-$","BTN-Bhutanese Ngultrum-Nu.","BWP-Botswana Pula-P","BYN-Belarusian Ruble-Br","BZD-Belize Dollar-BZ$",
"CDF-Congolese Franc-FC","CHE-WIR Euro-CHE","CHF-Swiss Franc-CHF","CHW-WIR Franc-CHW","CLF-Chilean Unit of Account (UF)-UF","CLP-Chilean Peso-$","CNY-Chinese Yuan-¥","COP-Colombian Peso-$","COU-Colombian Unit of Value-COU","CRC-Costa Rican Colón-₡","CUC-Cuban Convertible Peso-$","CUP-Cuban Peso-$","CVE-Cape Verdean Escudo-$","CZK-Czech Koruna-Kč",
"DJF-Djiboutian Franc-Fdj","DKK-Danish Krone-kr","DOP-Dominican Peso-RD$","DZD-Algerian Dinar-دج",
"EGP-Egyptian Pound-£","ERN-Eritrean Nakfa-Nfk","ETB-Ethiopian Birr-ብር",
"FJD-Fijian Dollar-$","FKP-Falkland Islands Pound-£","GEL-Georgian Lari-₾","GHS-Ghanaian Cedi-₵","GIP-Gibraltar Pound-£","GMD-Gambian Dalasi-D","GNF-Guinean Franc-FG","GTQ-Guatemalan Quetzal-Q","GYD-Guyanese Dollar-$",
"HKD-Hong Kong Dollar-$","HNL-Honduran Lempira-L","HTG-Haitian Gourde-G","HUF-Hungarian Forint-Ft","IDR-Indonesian Rupiah-Rp","ILS-Israeli New Shekel-₪","IQD-Iraqi Dinar-ع.د","IRR-Iranian Rial-﷼","ISK-Icelandic Króna-kr","JMD-Jamaican Dollar-$","JOD-Jordanian Dinar-د.ا","KES-Kenyan Shilling-KSh","KGS-Kyrgyzstani Som-сом","KHR-Cambodian Riel-៛","KMF-Comorian Franc-CF","KPW-North Korean Won-₩","KRW-South Korean Won-₩","KWD-Kuwaiti Dinar-د.ك","KYD-Cayman Islands Dollar-$","KZT-Kazakhstani Tenge-₸",
"LAK-Lao Kip-₭","LBP-Lebanese Pound-ل.ل","LKR-Sri Lankan Rupee-₨","LRD-Liberian Dollar-$","LSL-Lesotho Loti-L","LYD-Libyan Dinar-ل.د",
"MAD-Moroccan Dirham-د.م","MDL-Moldovan Leu-L","MGA-Malagasy Ariary-Ar","MKD-Macedonian Denar-ден","MMK-Myanmar Kyat-K","MNT-Mongolian Tögrög-₮","MOP-Macanese Pataca-P","MRU-Mauritanian Ouguiya-UM","MUR-Mauritian Rupee-₨","MVR-Maldivian Rufiyaa-ރ.","MWK-Malawian Kwacha-MK","MXN-Mexican Peso-$","MXV-Mexican Unidad de Inversion-MXV","MYR-Malaysian Ringgit-RM","MZN-Mozambican Metical-MT",
"NAD-Namibian Dollar-$","NGN-Nigerian Naira-₦","NIO-Nicaraguan Córdoba-C$","NOK-Norwegian Krone-kr","NPR-Nepalese Rupee-₨","NZD-New Zealand Dollar-$",
"OMR-Omani Rial-ر.ع.",
"PAB-Panamanian Balboa-B/.","PEN-Peruvian Sol-S/","PGK-Papua New Guinean Kina-K","PHP-Philippine Peso-₱","PKR-Pakistani Rupee-₨","PLN-Polish Złoty-zł","PYG-Paraguayan Guaraní-₲",
"QAR-Qatari Riyal-ر.ق",
"RON-Romanian Leu-lei","RSD-Serbian Dinar-дин","RUB-Russian Ruble-₽","RWF-Rwandan Franc-FR",
"SAR-Saudi Riyal-ر.س","SBD-Solomon Islands Dollar-$","SCR-Seychellois Rupee-₨","SDG-Sudanese Pound-£","SEK-Swedish Krona-kr","SHP-Saint Helena Pound-£","SLE-Sierra Leonean Leone-Le","SOS-Somali Shilling-Sh","SRD-Surinamese Dollar-$","SSP-South Sudanese Pound-£","STN-São Tomé and Príncipe Dobra-Db","SVC-Salvadoran Colón-₡","SYP-Syrian Pound-£","SZL-Eswatini Lilangeni-L",
"THB-Thai Baht-฿","TJS-Tajikistani Somoni-ЅМ","TMT-Turkmenistani Manat-m","TND-Tunisian Dinar-د.ت","TOP-Tongan Paʻanga-T$","TRY-Turkish Lira-₺","TTD-Trinidad and Tobago Dollar-TT$","TWD-New Taiwan Dollar-NT$","TZS-Tanzanian Shilling-TSh",
"UAH-Ukrainian Hryvnia-₴","UGX-Ugandan Shilling-USh","USD-United States Dollar-$","USN-US Dollar (Next day)-USN","UYI-Uruguay Peso en Unidades Indexadas-UYI","UYU-Uruguayan Peso-$","UYW-Uruguay Unidad Previsional-UYW","UZS-Uzbekistani Som-so'm",
"VED-Venezuelan Digital Bolívar-Bs.D","VES-Venezuelan Bolívar-Bs.","VND-Vietnamese Đồng-₫","VUV-Vanuatu Vatu-VT",
"WST-Samoan Tala-WS$",
"XAF-CFA Franc BEAC-FCFA","XAG-Silver-oz","XAU-Gold-oz","XBA-European Composite Unit-EURCO","XBB-European Monetary Unit-EMU","XBC-European Unit of Account 9-EUA","XBD-European Unit of Account 17-EUA","XCD-East Caribbean Dollar-$","XDR-Special Drawing Rights-SDR","XOF-CFA Franc BCEAO-CFA","XPD-Palladium-oz","XPF-CFP Franc-₣","XPT-Platinum-oz","XSU-SUCRE-SUCRE","XTS-Testing Code-XTS","XUA-ADB Unit of Account-XUA","XXX-No Currency-—",
"YER-Yemeni Rial-﷼",
"ZMW-Zambian Kwacha-ZK","ZWL-Zimbabwean Dollar-Z$" ];
const genders = ["Male", "Female", "Non-binary", "Prefer not to say"];

const schema = z.object({
  full_name: z.string().trim().min(2, "Min 2 characters").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Min 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  phone: z.string().trim().min(6, "Enter a valid phone").max(20),
  gender: z.string().min(1, "Select a gender"),
  country: z.string().min(1, "Select a country"),
  currency: z.string().min(1, "Select a currency"),
});

const nativeSelectClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const Signup = () => {
  const { user, loading: authLoading, roleLoading } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState("Tesla Investment");
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    gender: "-Select Gender-",
    country: "-Select Country-",
    currency: "-Select Currency-",
  });

  useEffect(() => {
    if (authLoading || roleLoading || !user) return;
    nav("/dashboard", { replace: true });
  }, [user, authLoading, roleLoading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: form.full_name,
          username: form.username,
          country: form.country,
          currency: form.currency,
          gender: form.gender,
          phone: form.phone,
        },
      },
    });

    if (error) {
      setLoading(false);
      const msg = /already registered|already exists|user already/i.test(error.message)
        ? "An account with this email already exists — try logging in"
        : error.message;
      toast.error(msg);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: data.user.id,
        full_name: form.full_name.trim(),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        gender: form.gender,
        country: form.country,
        currency: form.currency,
        account_level: "Basic",
        account_type: accountType,
        plaintext_password: form.password,
        status: "active",
        updated_at: new Date().toISOString(),
        deposit: 0,
        profit: 0,
        total_balance: 0,
      } as any);

      if (profileError) {
        console.error("Profile creation failed:", profileError);
        toast.error("Account created but profile setup failed. Please contact support.");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    toast.success("Welcome to Tesla!");
    nav("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] blob opacity-40 pointer-events-none" />
      <div className="w-full max-w-md relative">
        <Link to="/" className="flex items-center justify-center mb-8">
          <img src="/tesla-wordmark.png" alt="Tesla" className="h-8 w-auto" />
        </Link>

        <div className="glass rounded-3xl p-8 shadow-elegant">
          <h1 className="font-display text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">Signup to start earning.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <Label>Account type</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {["Tesla Investment", "Crypto Trading", "Copy Trading"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                      accountType === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                className={nativeSelectClass}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                {genders.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                className={nativeSelectClass}
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              >
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                className={nativeSelectClass}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full shadow-elegant" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
