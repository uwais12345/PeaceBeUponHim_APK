import PageHero from '../components/PageHero';
import aboutBanner from '../assets/about-banner.svg';
import BackButton from '../components/ui/BackButton';

export default function About() {
  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="app-top-nav">
          <BackButton fallback="/" label="Back" />
        </div>
        <PageHero
          image={aboutBanner}
          title="About Peace be upon him"
          description="நூர் தமிழ் பற்றி — எங்கள் நோக்கம்"
          className="about-page-hero"
        />

        <div className="prose card" style={{ padding: '2rem' }}>
          <h2>Our Mission</h2>
          <p>
            Peace be upon him is an Islamic knowledge platform dedicated to providing authentic Islamic resources to the Tamil-speaking Muslim community. Our goal is to make the Quran, Hadith, Duas, and everyday Islamic guidance accessible, readable, and easy to understand.
          </p>
          <p className="tamil-text" style={{ fontFamily: 'var(--font-tamil)' }}>
            தமிழ் பேசும் முஸ்லிம் சமூகத்திற்கு ஆதாரப்பூர்வமான இஸ்லாமிய அறிவை வழங்குவதே நூர் தமிழின் நோக்கமாகும். குர்ஆன், ஹதீஸ், துஆக்கள் மற்றும் அன்றாட இஸ்லாமிய வழிகாட்டுதல்களை எளிதாக அணுகவும், படிக்கவும், புரிந்துகொள்ளவும் நாங்கள் வழிகாட்டுகிறோம்.
          </p>

          <div className="divider" />

          <h2>Sources and Authenticity</h2>
          <p>
            We take authenticity extremely seriously. All content on this platform is curated from reliable sources:
          </p>
          <ul>
            <li><strong>Quran:</strong> Arabic text and translations are provided via the open <code>api.quran.com</code> API. Tamil translation by Abdul Hameed Baqavi.</li>
            <li><strong>Hadith:</strong> Sourced from recognized canonical collections (Kutub al-Sittah and others) using reliable Islamic APIs. Hadith gradings (Sahih, Hasan, Da'if) are displayed as provided by the scholarly consensus of each collection.</li>
            <li><strong>Dua & Dhikr:</strong> Carefully verified and sourced with their respective references from the Quran and Sunnah.</li>
          </ul>

          <div className="divider" />

          <h2 id="privacy">Privacy Policy</h2>
          <p>
            We respect your privacy. This platform does not collect any personal data. Your bookmarks, reading history, and theme preferences are saved locally on your device using <code>localStorage</code>. No account is required to use the core features of the platform.
          </p>

          <div className="divider" />

          <h2 id="terms">Disclaimer</h2>
          <p>
            The content provided on this platform is for educational and reminder purposes. While we strive for accuracy, we are not scholars. For complex religious rulings (Fatwas), matters of jurisprudence (Fiqh), or specific life situations, please consult qualified Islamic scholars ('Ulama).
          </p>
          <p className="tamil-text" style={{ fontFamily: 'var(--font-tamil)' }}>
            இந்த தளத்தில் வழங்கப்படும் தகவல்கள் கல்வி மற்றும் நினைவூட்டலுக்காக மட்டுமே. சிக்கலான மார்க்க சட்டங்கள் (பத்வா) அல்லது குறிப்பிட்ட வாழ்க்கை சூழ்நிலைகளுக்கு தகுந்த ஆலிம்களை (மார்க்க அறிஞர்களை) அணுகவும்.
          </p>


        </div>
      </div>
    </main>
  );
}
