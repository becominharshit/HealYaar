import { SupportedLanguage } from '../types';
import { mergeTranslationWithFallback } from '../utils/healthFormatters';

export interface Translations {
  appName: string;
  appTagline: string;
  accessibleSubtitle: string;
  emergencySos: string;
  emergencyModalTitle: string;
  emergencyModalDesc: string;
  callAmbulance: string;
  callMentalHealth: string;
  callNationalEmergency: string;
  emergencyStep1: string;
  emergencyStep2: string;
  emergencyStep3: string;
  close: string;
  textSize: string;
  highContrast: string;
  languageSelect: string;
  regionalSelect: string;
  micPermissionTitle: string;
  micPermissionDesc: string;
  allow: string;
  deny: string;
  listening: string;
  listeningHint: string;
  stopListening: string;
  tapToSpeak: string;
  speechUnavailable: string;
  voiceReadAloud: string;
  voiceReading: string;
  stopAudio: string;
  disclaimerBadge: string;
  disclaimerText: string;
  privacyBadge: string;
  privacyText: string;
  syntheticDataNotice: string;
  nav: {
    home: string;
    assistant: string;
    symptoms: string;
    reports: string;
    nutrition: string;
    doctors: string;
    fitness: string;
    medicines: string;
    mental: string;
    period: string;
    reminders: string;
  };
  home: {
    welcomeHeading: string;
    welcomeSubheading: string;
    searchPlaceholder: string;
    askButton: string;
    voiceTip: string;
    sectionToolsTitle: string;
    cardAssistantDesc: string;
    cardSymptomsDesc: string;
    cardReportsDesc: string;
    cardMedicinesDesc: string;
    cardNutritionDesc: string;
    cardPeriodDesc: string;
    cardDoctorsDesc: string;
    cardMentalDesc: string;
    cardFitnessDesc: string;
    cardRemindersDesc: string;
  };
  actions: {
    startDemo: string;
    findDoctor: string;
    viewSample: string;
    uploadFile: string;
    calculate: string;
    save: string;
    delete: string;
    edit: string;
    clear: string;
    back: string;
    readSummary: string;
  };
}

export const translations: Record<'en' | 'hi' | 'mr', Translations> = {
  en: {
    appName: 'HealYaar',
    appTagline: 'Your Accessible AI Health Friend',
    accessibleSubtitle: 'Simple language • High contrast • Voice enabled • Educational only',
    emergencySos: 'Emergency SOS / Help',
    emergencyModalTitle: 'Immediate Medical Emergency Support',
    emergencyModalDesc:
      'If you or someone nearby is experiencing chest pain, severe breathlessness, sudden weakness, or thoughts of self-harm, please seek immediate help.',
    callAmbulance: 'Call Ambulance (108)',
    callMentalHealth: 'Tele-MANAS Mental Health (14416)',
    callNationalEmergency: 'National Emergency (112)',
    emergencyStep1: 'Sit down comfortably and loosen any tight clothing around your chest and neck.',
    emergencyStep2: 'Unlock your front door so emergency responders can enter immediately.',
    emergencyStep3: 'Do not attempt to drive yourself to the hospital. Stay on the phone with responders.',
    close: 'Close',
    textSize: 'Text Size',
    highContrast: 'High Contrast',
    languageSelect: 'Language',
    regionalSelect: 'Regional Language',
    micPermissionTitle: 'Microphone Access Request',
    micPermissionDesc:
      'We only use your microphone to listen to your health questions or voice commands while you tap the microphone button. We NEVER listen in the background, record without your permission, or send your raw audio to third parties.',
    allow: 'Allow & Continue',
    deny: 'Not Now / Use Keyboard',
    listening: 'Listening now... Speak your question or command',
    listeningHint: "Try saying: 'Check knee pain' or 'Go to doctors' or 'Open mental health'",
    stopListening: 'Stop Listening',
    tapToSpeak: 'Tap to Speak',
    speechUnavailable: 'Voice recognition is not supported in this browser. You can type freely or use the on-screen buttons.',
    voiceReadAloud: 'Read Aloud',
    voiceReading: 'Reading...',
    stopAudio: 'Stop Voice',
    disclaimerBadge: 'Educational Health Friend',
    disclaimerText:
      'HealYaar provides plain-language educational guidance only. It does not provide medical diagnosis, prescribe drugs, or replace a licensed clinician.',
    privacyBadge: 'Private & On-Device',
    privacyText: 'Your entries and health files stay isolated to your private account. Nothing is shared without your clear consent.',
    syntheticDataNotice:
      'Demo Notice: Sample doctor listings, lab reports, prescriptions, and catalog entries are educational demonstrations.',
    nav: {
      home: 'Home',
      assistant: 'AI Assistant',
      symptoms: 'Symptom Guidance',
      reports: 'Medical Reports',
      nutrition: 'Food & Nutrition',
      doctors: 'Doctors Nearby',
      fitness: 'Fitness & Supplements',
      medicines: 'Prescriptions',
      mental: 'Mental Wellbeing',
      period: 'Period Tracker',
      reminders: 'Reminders'
    },
    home: {
      welcomeHeading: 'How can HealYaar help you today?',
      welcomeSubheading: 'Plain-language answers grounded in your private health vault and clinical guidelines.',
      searchPlaceholder: 'Ask about a symptom, lab value, or medicine...',
      askButton: 'Ask HealYaar',
      voiceTip: 'Tap the microphone to ask hands-free in English or Hindi',
      sectionToolsTitle: 'Your Health Companion Tools',
      cardAssistantDesc: 'Ask health questions grounded in your private records & clinical references.',
      cardSymptomsDesc: 'Structured symptom triage with red-flag emergency checks.',
      cardReportsDesc: 'Upload blood tests or lab PDFs for plain-language explanations.',
      cardMedicinesDesc: 'Scan prescriptions, verify dosages, and find nearby pharmacies.',
      cardNutritionDesc: 'Analyze Indian meals, household portions, and balanced thalis.',
      cardPeriodDesc: 'Private menstrual cycle tracking, phase insights, and symptom logs.',
      cardDoctorsDesc: 'Locate verified regional clinics and specialists near you.',
      cardMentalDesc: 'Guided breathing exercises, stress relief, and 14416 helpline support.',
      cardFitnessDesc: 'Daily steps & hydration tracker, gentle workouts, and supplement safety.',
      cardRemindersDesc: 'Set reliable pill schedules and doctor appointment alerts.'
    },
    actions: {
      startDemo: 'Try Sample Journey',
      findDoctor: 'Find Related Doctors',
      viewSample: 'Open Sample Record',
      uploadFile: 'Upload Document',
      calculate: 'Calculate Estimates',
      save: 'Save to Device',
      delete: 'Delete Record',
      edit: 'Edit Details',
      clear: 'Clear All',
      back: 'Go Back',
      readSummary: 'Listen to Summary'
    }
  },
  hi: {
    appName: 'हीलयार (HealYaar)',
    appTagline: 'आपका सुलभ एआई स्वास्थ्य मित्र',
    accessibleSubtitle: 'सरल भाषा • उच्च कंट्रास्ट • आवाज़ सहायता • केवल शैक्षिक मार्गदर्शन',
    emergencySos: 'आपातकालीन सहायता (SOS)',
    emergencyModalTitle: 'आपातकालीन चिकित्सा सहायता',
    emergencyModalDesc:
      'यदि आपको या किसी को सीने में तेज दर्द, सांस लेने में अत्यधिक कठिनाई, अचानक कमजोरी या बेचैनी है, तो तुरंत आपातकालीन सहायता लें।',
    callAmbulance: 'एंबुलेंस को कॉल करें (108)',
    callMentalHealth: 'टेली-मानस मानसिक स्वास्थ्य (14416)',
    callNationalEmergency: 'राष्ट्रीय आपातकालीन नंबर (112)',
    emergencyStep1: 'आराम से बैठ जाएं और गर्दन व सीने के टाइट कपड़ों को ढीला करें।',
    emergencyStep2: 'घर का मुख्य दरवाजा खोल दें ताकि सहायता टीम तुरंत अंदर आ सके।',
    emergencyStep3: 'खुद गाड़ी चलाकर अस्पताल जाने का प्रयास न करें। कॉल पर बने रहें।',
    close: 'बंद करें',
    textSize: 'अक्षर का आकार',
    highContrast: 'हाई कंट्रास्ट',
    languageSelect: 'भाषा',
    regionalSelect: 'क्षेत्रीय भाषा',
    micPermissionTitle: 'माइक उपयोग की अनुमति',
    micPermissionDesc:
      'हम आपके माइक का उपयोग केवल तब करते हैं जब आप माइक बटन दबाकर प्रश्न बोलते हैं। हम बैकग्राउंड में कभी नहीं सुनते और न ही डेटा किसी तीसरे पक्ष को भेजते हैं।',
    allow: 'अनुमति दें और आगे बढ़ें',
    deny: 'अभी नहीं / कीबोर्ड का उपयोग करें',
    listening: 'सुन रहे हैं... अपना प्रश्न या निर्देश बोलें',
    listeningHint: "बोलें: 'घुटने का दर्द' या 'डॉक्टर खोजें' या 'मानसिक स्वास्थ्य'",
    stopListening: 'बोलना समाप्त करें',
    tapToSpeak: 'बोलने के लिए दबाएं',
    speechUnavailable: 'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। आप लिखकर उपयोग कर सकते हैं।',
    voiceReadAloud: 'आवाज़ में सुनें',
    voiceReading: 'पढ़ा जा रहा है...',
    stopAudio: 'आवाज़ रोकें',
    disclaimerBadge: 'शैक्षिक स्वास्थ्य मित्र',
    disclaimerText:
      'हीलयार (HealYaar) केवल सामान्य स्वास्थ्य जानकारी और समझ को आसान बनाने के लिए है। यह डॉक्टर का विकल्प या चिकित्सकीय निदान नहीं है।',
    privacyBadge: 'गोपनीय एवं सुरक्षित',
    privacyText:
      'आपकी स्वास्थ्य जानकारी आपके निजी खाते में ही सुरक्षित रहती है। आपकी अनुमति के बिना कहीं नहीं भेजी जाती।',
    syntheticDataNotice:
      'डेमो सूचना: सभी नमूना डॉक्टर सूची, लैब रिपोर्ट और दवाएं केवल समझने के लिए काल्पनिक (डेमो) हैं।',
    nav: {
      home: 'होम',
      assistant: 'एआई साथी',
      symptoms: 'लक्षण मार्गदर्शन',
      reports: 'जांच रिपोर्ट',
      nutrition: 'आहार व पोषण',
      doctors: 'पास के डॉक्टर',
      fitness: 'व्यायाम व सप्लीमेंट',
      medicines: 'दवाएं व पर्ची',
      mental: 'मानसिक स्वास्थ्य',
      period: 'मासिक धर्म ट्रैकर',
      reminders: 'दवा रिमाइंडर'
    },
    home: {
      welcomeHeading: 'आज हीलयार आपकी कैसे मदद कर सकता है?',
      welcomeSubheading: 'आपकी निजी स्वास्थ्य रिपोर्ट और प्रमाणित चिकित्सा दिशानिर्देशों पर आधारित सरल जानकारी।',
      searchPlaceholder: 'लक्षण, जांच रिपोर्ट या दवा के बारे में पूछें...',
      askButton: 'हीलयार से पूछें',
      voiceTip: 'हिंदी या अंग्रेजी में बोलकर पूछने के लिए माइक बटन दबाएं',
      sectionToolsTitle: 'आपके स्वास्थ्य सहायता उपकरण',
      cardAssistantDesc: 'अपनी रिपोर्ट और चिकित्सा संदर्भ के साथ सरल भाषा में प्रश्न पूछें।',
      cardSymptomsDesc: 'लक्षणों की जांच और आपातकालीन चेतावनी संकेतों की पहचान।',
      cardReportsDesc: 'खून की जांच या लैब रिपोर्ट अपलोड करें और आसान भाषा में समझें।',
      cardMedicinesDesc: 'डॉक्टर की पर्ची स्कैन करें, खुराक जांचें और पास की फार्मेसी खोजें।',
      cardNutritionDesc: 'भारतीय भोजन, कटोरी-रोटी कैलोरी और संतुलित थाली का विश्लेषण करें।',
      cardPeriodDesc: 'गोपनीय मासिक धर्म चक्र ट्रैकर, चरण जानकारी और लक्षण लॉग।',
      cardDoctorsDesc: 'अपने आस-पास के विशेषज्ञ डॉक्टर और क्लिनिक खोजें।',
      cardMentalDesc: 'शांत श्वास अभ्यास, तनाव प्रबंधन और 14416 हेल्पलाइन सहायता।',
      cardFitnessDesc: 'दैनिक कदम व पानी ट्रैकर, सरल व्यायाम और सप्लीमेंट सुरक्षा जानकारी।',
      cardRemindersDesc: 'दवाओं और डॉक्टर अपॉइंटमेंट के लिए समय पर अलार्म सेट करें।'
    },
    actions: {
      startDemo: 'नमूना यात्रा शुरू करें',
      findDoctor: 'संबंधित डॉक्टर खोजें',
      viewSample: 'नमूना रिपोर्ट देखें',
      uploadFile: 'दस्तावेज़ अपलोड करें',
      calculate: 'अनुमानित गणना करें',
      save: 'सुरक्षित करें',
      delete: 'हटाएं',
      edit: 'संशोधित करें',
      clear: 'सब हटाएं',
      back: 'पीछे जाएं',
      readSummary: 'सारांश सुनें'
    }
  },
  mr: {
    appName: 'हीलयार (HealYaar)',
    appTagline: 'सुलभ आणि सोपा एआय आरोग्य मित्र',
    accessibleSubtitle: 'सोपी भाषा • मोठा फॉन्ट • आवाजाचा वापर • केवळ आरोग्य मार्गदर्शनासाठी',
    emergencySos: 'तातडीची मदत (SOS)',
    emergencyModalTitle: 'तातडीची वैद्यकीय मदत',
    emergencyModalDesc:
      'छातीत तीव्र कळ, श्वास घेण्यास त्रास, अचानक अशक्तपणा जाणवत असल्यास त्वरित आपत्कालीन मदत घ्या.',
    callAmbulance: 'रुग्णवाहिका बोलवा (108)',
    callMentalHealth: 'टेलि-मानस मानसिक आरोग्य (14416)',
    callNationalEmergency: 'आपत्कालीन क्रमांक (112)',
    emergencyStep1: 'शांत बसा आणि गळ्याभोवतीचे घट्ट कपडे सैल करा.',
    emergencyStep2: 'घराचे मुख्य दार उघडे ठेवा जेणेकरून मदत त्वरित पोहोचू शकेल.',
    emergencyStep3: 'स्वतः गाडी चालवून जाण्याचा प्रयत्न करू नका. शांत राहा.',
    close: 'बंद करा',
    textSize: 'अक्षराचा आकार',
    highContrast: 'हाय कॉन्ट्रास्ट',
    languageSelect: 'भाषा',
    regionalSelect: 'प्रादेशिक भाषा',
    micPermissionTitle: 'मायक्रोफोन परवानगी',
    micPermissionDesc:
      'आम्ही तुमचा आवाज फक्त तुम्ही मायक्रोफोन बटन दाबून बोलता तेव्हाच ऐकतो. आम्ही पार्श्वभूमीत कधीही रेकॉर्डिंग करत नाही.',
    allow: 'परवानगी द्या',
    deny: 'आता नको / टाईप करा',
    listening: 'ऐकत आहे... तुमचा प्रश्न किंवा आज्ञा बोला',
    listeningHint: "म्हणा: 'गुडघेदुखी' किंवा 'डॉक्टर शोधा' किंवा 'मानसिक आरोग्य'",
    stopListening: 'थांबवा',
    tapToSpeak: 'बोलण्यासाठी दाबा',
    speechUnavailable: 'या ब्राउझरमध्ये आवाज ओळख उपलब्ध नाही. आपण टाईप करून वापरू शकता.',
    voiceReadAloud: 'आवाजात ऐका',
    voiceReading: 'वाचत आहे...',
    stopAudio: 'आवाज बंद करा',
    disclaimerBadge: 'आरोग्य मार्गदर्शन मित्र',
    disclaimerText:
      'हीलयार (HealYaar) हे केवळ आरोग्य माहिती समजून घेण्यासाठी आहे. हा वैद्यकीय सल्ला किंवा डॉक्टरचा पर्याय नाही.',
    privacyBadge: 'खाजगी आणि सुरक्षित',
    privacyText: 'तुमची आरोग्य माहिती तुमच्याच खात्यात सुरक्षित राहते. ती कोठेही पाठवली जात नाही.',
    syntheticDataNotice: 'डेमो माहिती: सर्व नमुना डॉक्टर, लॅब रिपोर्ट्स आणि औषधे केवळ उदाहरणासाठी (डेमो) आहेत.',
    nav: {
      home: 'मुख्य पान',
      assistant: 'एआय सहाय्यक',
      symptoms: 'लक्षण मार्गदर्शन',
      reports: 'तपासणी अहवाल',
      nutrition: 'आहार व पोषण',
      doctors: 'जवळचे डॉक्टर',
      fitness: 'व्यायाम व सप्लिमेंट्स',
      medicines: 'औषधे व प्रिस्क्रिप्शन',
      mental: 'मानसिक स्वास्थ्य',
      period: 'मासिक पाळी ट्रॅकर',
      reminders: 'औषध आठवण'
    },
    home: {
      welcomeHeading: 'आज हीलयार तुम्हाला कशी मदत करू शकते?',
      welcomeSubheading: 'तुमचे खाजगी आरोग्य अहवाल आणि वैद्यकीय मार्गदर्शनावर आधारित सोपी उत्तरे.',
      searchPlaceholder: 'लक्षणे, लॅब रिपोर्ट किंवा औषधाबद्दल विचारा...',
      askButton: 'हीलयारला विचारा',
      voiceTip: 'बोलून प्रश्न विचारण्यासाठी माइक बटन दाबा',
      sectionToolsTitle: 'तुमची आरोग्य साधने',
      cardAssistantDesc: 'तुमच्या अहवालांवर आधारित सोप्या भाषेत आरोग्य प्रश्न विचारा.',
      cardSymptomsDesc: 'लक्षण तपासणी आणि तातडीच्या धोक्याच्या सूचना.',
      cardReportsDesc: 'लॅब रिपोर्ट अपलोड करा आणि सोप्या भाषेत समजून घ्या.',
      cardMedicinesDesc: 'डॉक्टरांचे प्रिस्क्रिप्शन स्कॅन करा आणि औषधे तपासा.',
      cardNutritionDesc: 'भारतीय जेवण, पोषणमूल्ये आणि संतुलित थाळी विश्लेषण.',
      cardPeriodDesc: 'खाजगी मासिक पाळी ट्रॅकर आणि लक्षणांची नोंद.',
      cardDoctorsDesc: 'तुमच्या जवळचे तज्ञ डॉक्टर आणि क्लिनिक शोधा.',
      cardMentalDesc: 'श्वासोच्छवासाचे व्यायाम आणि 14416 मानसिक आरोग्य मदत.',
      cardFitnessDesc: 'दैनिक चालणे व पाणी नोंद, हलके व्यायाम आणि सप्लिमेंट माहिती.',
      cardRemindersDesc: 'औषधे आणि डॉक्टर भेटींसाठी वेळेवर आठवण.'
    },
    actions: {
      startDemo: 'डेमो अनुभव सुरू करा',
      findDoctor: 'योग्य डॉक्टर शोधा',
      viewSample: 'नमुना अहवाल पहा',
      uploadFile: 'फाइल अपलोड करा',
      calculate: 'अंदाज काढा',
      save: 'जतन करा',
      delete: 'हटवा',
      edit: 'बदल करा',
      clear: 'सर्व पुसा',
      back: 'मागे या',
      readSummary: 'सारांश ऐका'
    }
  }
};

export const languageOptions: { code: SupportedLanguage; shortLabel: string; nativeName: string; englishName: string; langCode: string }[] = [
  { code: 'en', shortLabel: 'EN', nativeName: 'English', englishName: 'English', langCode: 'en-IN' },
  { code: 'hi', shortLabel: 'HI', nativeName: 'हिन्दी', englishName: 'Hindi', langCode: 'hi-IN' },
  { code: 'mr', shortLabel: 'MR', nativeName: 'मराठी', englishName: 'Marathi', langCode: 'mr-IN' },
  { code: 'ta', shortLabel: 'TA', nativeName: 'தமிழ்', englishName: 'Tamil', langCode: 'ta-IN' },
  { code: 'te', shortLabel: 'TE', nativeName: 'తెలుగు', englishName: 'Telugu', langCode: 'te-IN' },
  { code: 'bn', shortLabel: 'BN', nativeName: 'বাংলা', englishName: 'Bengali', langCode: 'bn-IN' },
  { code: 'gu', shortLabel: 'GU', nativeName: 'ગુજરાતી', englishName: 'Gujarati', langCode: 'gu-IN' }
];

export const regionalOptions = [
  { code: 'hi', name: 'हिन्दी (Hindi)', langCode: 'hi-IN' },
  { code: 'mr', name: 'मराठी (Marathi)', langCode: 'mr-IN' },
  { code: 'ta', name: 'தமிழ் (Tamil)', langCode: 'ta-IN' },
  { code: 'te', name: 'తెలుగు (Telugu)', langCode: 'te-IN' },
  { code: 'bn', name: 'বাংলা (Bengali)', langCode: 'bn-IN' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', langCode: 'gu-IN' }
];

/**
 * Strict fallback translation resolver.
 * Guarantees NO UI string ever renders blank even for partially translated regional languages.
 */
export function getSafeTranslations(lang: SupportedLanguage): Translations {
  if (lang === 'en') return translations.en;
  const candidate = translations[lang as 'hi' | 'mr'];
  return mergeTranslationWithFallback(translations.en, candidate);
}
