/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPES ---
interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

interface Juz {
    number: number;
    startSurahName: string;
    startSurahNameArabic: string;
    surah: number;
    ayah: number;
}

interface Verse {
    number: number;
    numberInSurah: number;
    text: string;
    englishTranslation: string;
    urduTranslation: string;
    surah: Surah;
}

interface Bookmark {
    id: string;
    surahName: string;
    surahNumber: number;
    surahEnglishName: string;
    verseNumber: number;
    verseData: Verse;
}

interface LastRead {
    surah?: Surah;
    verseNumberInSurah: number;
    surahNumber?: number; // for backward compatibility with old data in localStorage
}

// --- STATIC SURAH DATA ---
const ALL_SURAHS: Surah[] = [
    {"number":1,"name":"سُورَةُ ٱلْفَاتِحَةِ","englishName":"Al-Faatiha","englishNameTranslation":"The Opening","numberOfAyahs":7,"revelationType":"Meccan"},
    {"number":2,"name":"سُورَةُ ٱلْبَقَرَةِ","englishName":"Al-Baqara","englishNameTranslation":"The Cow","numberOfAyahs":286,"revelationType":"Medinan"},
    {"number":3,"name":"سُورَةُ آلِ عِمْرَانَ","englishName":"Aal-i-Imraan","englishNameTranslation":"The Family of Imraan","numberOfAyahs":200,"revelationType":"Medinan"},
    {"number":4,"name":"سُورَةُ ٱلنِّسَاءِ","englishName":"An-Nisaa","englishNameTranslation":"The Women","numberOfAyahs":176,"revelationType":"Medinan"},
    {"number":5,"name":"سُورَةُ ٱلْمَائِدَةِ","englishName":"Al-Maaida","englishNameTranslation":"The Table","numberOfAyahs":120,"revelationType":"Medinan"},
    {"number":6,"name":"سُورَةُ ٱلْأَنْعَامِ","englishName":"Al-An'aam","englishNameTranslation":"The Cattle","numberOfAyahs":165,"revelationType":"Meccan"},
    {"number":7,"name":"سُورَةُ ٱلْأَعْرَافِ","englishName":"Al-A'raaf","englishNameTranslation":"The Heights","numberOfAyahs":206,"revelationType":"Meccan"},
    {"number":8,"name":"سُورَةُ ٱلْأَنْفَالِ","englishName":"Al-Anfaal","englishNameTranslation":"The Spoils of War","numberOfAyahs":75,"revelationType":"Medinan"},
    {"number":9,"name":"سُورَةُ ٱلتَّوْبَةِ","englishName":"At-Tawba","englishNameTranslation":"The Repentance","numberOfAyahs":129,"revelationType":"Medinan"},
    {"number":10,"name":"سُورَةُ يُونُسَ","englishName":"Yunus","englishNameTranslation":"Jonas","numberOfAyahs":109,"revelationType":"Meccan"},
    {"number":11,"name":"سُورَةُ هُودٍ","englishName":"Hud","englishNameTranslation":"Hud","numberOfAyahs":123,"revelationType":"Meccan"},
    {"number":12,"name":"سُورَةُ يُوسُفَ","englishName":"Yusuf","englishNameTranslation":"Joseph","numberOfAyahs":111,"revelationType":"Meccan"},
    {"number":13,"name":"سُورَةُ ٱلرَّعْدِ","englishName":"Ar-Ra'd","englishNameTranslation":"The Thunder","numberOfAyahs":43,"revelationType":"Medinan"},
    {"number":14,"name":"سُورَةُ إِبْرَاهِيمَ","englishName":"Ibrahim","englishNameTranslation":"Abraham","numberOfAyahs":52,"revelationType":"Meccan"},
    {"number":15,"name":"سُورَةُ ٱلْحِجْرِ","englishName":"Al-Hijr","englishNameTranslation":"The Rock","numberOfAyahs":99,"revelationType":"Meccan"},
    {"number":16,"name":"سُورَةُ ٱلنَّحْلِ","englishName":"An-Nahl","englishNameTranslation":"The Bee","numberOfAyahs":128,"revelationType":"Meccan"},
    {"number":17,"name":"سُورَةُ ٱلْإِسْرَاءِ","englishName":"Al-Israa","englishNameTranslation":"The Night Journey","numberOfAyahs":111,"revelationType":"Meccan"},
    {"number":18,"name":"سُورَةُ ٱلْكَهْفِ","englishName":"Al-Kahf","englishNameTranslation":"The Cave","numberOfAyahs":110,"revelationType":"Meccan"},
    {"number":19,"name":"سُورَةُ مَرْيَمَ","englishName":"Maryam","englishNameTranslation":"Mary","numberOfAyahs":98,"revelationType":"Meccan"},
    {"number":20,"name":"سُورَةُ طه","englishName":"Taa-Haa","englishNameTranslation":"Taa-Haa","numberOfAyahs":135,"revelationType":"Meccan"},
    {"number":21,"name":"سُورَةُ ٱلْأَنْبِيَاءِ","englishName":"Al-Anbiyaa","englishNameTranslation":"The Prophets","numberOfAyahs":112,"revelationType":"Meccan"},
    {"number":22,"name":"سُورَةُ ٱلْحَجِّ","englishName":"Al-Hajj","englishNameTranslation":"The Pilgrimage","numberOfAyahs":78,"revelationType":"Medinan"},
    {"number":23,"name":"سُورَةُ ٱلْمُؤْمِنُونَ","englishName":"Al-Muminoon","englishNameTranslation":"The Believers","numberOfAyahs":118,"revelationType":"Meccan"},
    {"number":24,"name":"سُورَةُ ٱلنُّورِ","englishName":"An-Noor","englishNameTranslation":"The Light","numberOfAyahs":64,"revelationType":"Medinan"},
    {"number":25,"name":"سُورَةُ ٱلْفُرْقَانِ","englishName":"Al-Furqaan","englishNameTranslation":"The Criterion","numberOfAyahs":77,"revelationType":"Meccan"},
    {"number":26,"name":"سُورَةُ ٱلشُّعَرَاءِ","englishName":"Ash-Shu'araa","englishNameTranslation":"The Poets","numberOfAyahs":227,"revelationType":"Meccan"},
    {"number":27,"name":"سُورَةُ ٱلنَّمْلِ","englishName":"An-Naml","englishNameTranslation":"The Ant","numberOfAyahs":93,"revelationType":"Meccan"},
    {"number":28,"name":"سُورَةُ ٱلْقَصَصِ","englishName":"Al-Qasas","englishNameTranslation":"The Stories","numberOfAyahs":88,"revelationType":"Meccan"},
    {"number":29,"name":"سُورَةُ ٱلْعَنْكَبُوتِ","englishName":"Al-Ankaboot","englishNameTranslation":"The Spider","numberOfAyahs":69,"revelationType":"Meccan"},
    {"number":30,"name":"سُورَةُ ٱلرُّومِ","englishName":"Ar-Room","englishNameTranslation":"The Romans","numberOfAyahs":60,"revelationType":"Meccan"},
    {"number":31,"name":"سُورَةُ لُقْمَانَ","englishName":"Luqman","englishNameTranslation":"Luqman","numberOfAyahs":34,"revelationType":"Meccan"},
    {"number":32,"name":"سُورَةُ ٱلسَّجْدَةِ","englishName":"As-Sajda","englishNameTranslation":"The Prostration","numberOfAyahs":30,"revelationType":"Meccan"},
    {"number":33,"name":"سُورَةُ ٱلْأَحْزَابِ","englishName":"Al-Ahzaab","englishNameTranslation":"The Clans","numberOfAyahs":73,"revelationType":"Medinan"},
    {"number":34,"name":"سُورَةُ سَبَإٍ","englishName":"Saba","englishNameTranslation":"Sheba","numberOfAyahs":54,"revelationType":"Meccan"},
    {"number":35,"name":"سُورَةُ فَاطِرٍ","englishName":"Faatir","englishNameTranslation":"The Originator","numberOfAyahs":45,"revelationType":"Meccan"},
    {"number":36,"name":"سُورَةُ يسٓ","englishName":"Yaseen","englishNameTranslation":"Yaseen","numberOfAyahs":83,"revelationType":"Meccan"},
    {"number":37,"name":"سُورَةُ ٱلصَّافَّاتِ","englishName":"As-Saaffaat","englishNameTranslation":"Those who set the Ranks","numberOfAyahs":182,"revelationType":"Meccan"},
    {"number":38,"name":"سُورَةُ صٓ","englishName":"Saad","englishNameTranslation":"The Letter \"Saad\"","numberOfAyahs":88,"revelationType":"Meccan"},
    {"number":39,"name":"سُورَةُ ٱلزُّمَرِ","englishName":"Az-Zumar","englishNameTranslation":"The Troops","numberOfAyahs":75,"revelationType":"Meccan"},
    {"number":40,"name":"سُورَةُ غَافِرٍ","englishName":"Ghafir","englishNameTranslation":"The Forgiver","numberOfAyahs":85,"revelationType":"Meccan"},
    {"number":41,"name":"سُورَةُ فُصِّلَتْ","englishName":"Fussilat","englishNameTranslation":"Explained in detail","numberOfAyahs":54,"revelationType":"Meccan"},
    {"number":42,"name":"سُورَةُ ٱلشُّورَىٰ","englishName":"Ash-Shura","englishNameTranslation":"The Consultation","numberOfAyahs":53,"revelationType":"Meccan"},
    {"number":43,"name":"سُورَةُ ٱلزُّخْرُفِ","englishName":"Az-Zukhruf","englishNameTranslation":"The Ornaments of Gold","numberOfAyahs":89,"revelationType":"Meccan"},
    {"number":44,"name":"سُورَةُ ٱلدُّخَانِ","englishName":"Ad-Dukhaan","englishNameTranslation":"The Smoke","numberOfAyahs":59,"revelationType":"Meccan"},
    {"number":45,"name":"سُورَةُ ٱلْجَاثِيَةِ","englishName":"Al-Jaathiya","englishNameTranslation":"The Kneeling","numberOfAyahs":37,"revelationType":"Meccan"},
    {"number":46,"name":"سُورَةُ ٱلْأَحْقَافِ","englishName":"Al-Ahqaf","englishNameTranslation":"The Sandhills","numberOfAyahs":35,"revelationType":"Meccan"},
    {"number":47,"name":"سُورَةُ مُحَمَّدٍ","englishName":"Muhammad","englishNameTranslation":"Muhammad","numberOfAyahs":38,"revelationType":"Medinan"},
    {"number":48,"name":"سُورَةُ ٱلْفَتْحِ","englishName":"Al-Fath","englishNameTranslation":"The Victory","numberOfAyahs":29,"revelationType":"Medinan"},
    {"number":49,"name":"سُورَةُ ٱلْحُجُرَاتِ","englishName":"Al-Hujuraat","englishNameTranslation":"The Inner Apartments","numberOfAyahs":18,"revelationType":"Medinan"},
    {"number":50,"name":"سُورَةُ قٓ","englishName":"Qaaf","englishNameTranslation":"The Letter \"Qaaf\"","numberOfAyahs":45,"revelationType":"Meccan"},
    {"number":51,"name":"سُورَةُ ٱلذَّارِيَاتِ","englishName":"Adh-Dhaariyat","englishNameTranslation":"The Winnowing Winds","numberOfAyahs":60,"revelationType":"Meccan"},
    {"number":52,"name":"سُورَةُ ٱلطُّورِ","englishName":"At-Tur","englishNameTranslation":"The Mount","numberOfAyahs":49,"revelationType":"Meccan"},
    {"number":53,"name":"سُورَةُ ٱلنَّجْمِ","englishName":"An-Najm","englishNameTranslation":"The Star","numberOfAyahs":62,"revelationType":"Meccan"},
    {"number":54,"name":"سُورَةُ ٱلْقَمَرِ","englishName":"Al-Qamar","englishNameTranslation":"The Moon","numberOfAyahs":55,"revelationType":"Meccan"},
    {"number":55,"name":"سُورَةُ ٱلرَّحْمَٰن","englishName":"Ar-Rahmaan","englishNameTranslation":"The Beneficent","numberOfAyahs":78,"revelationType":"Medinan"},
    {"number":56,"name":"سُورَةُ ٱلْوَاقِعَةِ","englishName":"Al-Waaqia","englishNameTranslation":"The Inevitable","numberOfAyahs":96,"revelationType":"Meccan"},
    {"number":57,"name":"سُورَةُ ٱلْحَدِيدِ","englishName":"Al-Hadid","englishNameTranslation":"The Iron","numberOfAyahs":29,"revelationType":"Medinan"},
    {"number":58,"name":"سُورَةُ ٱلْمُجَادِلَةِ","englishName":"Al-Mujaadila","englishNameTranslation":"The Pleading Woman","numberOfAyahs":22,"revelationType":"Medinan"},
    {"number":59,"name":"سُورَةُ ٱلْحَشْرِ","englishName":"Al-Hashr","englishNameTranslation":"The Exile","numberOfAyahs":24,"revelationType":"Medinan"},
    {"number":60,"name":"سُورَةُ ٱلْمُمْتَحَنَةِ","englishName":"Al-Mumtahana","englishNameTranslation":"She that is to be examined","numberOfAyahs":13,"revelationType":"Medinan"},
    {"number":61,"name":"سُورَةُ ٱلصَّفِّ","englishName":"As-Saff","englishNameTranslation":"The Ranks","numberOfAyahs":14,"revelationType":"Medinan"},
    {"number":62,"name":"سُورَةُ ٱلْجُمُعَةِ","englishName":"Al-Jumu'a","englishNameTranslation":"The Congregation, Friday","numberOfAyahs":11,"revelationType":"Medinan"},
    {"number":63,"name":"سُورَةُ ٱلْمُنَافِقُونَ","englishName":"Al-Munaafiqoon","englishNameTranslation":"The Hypocrites","numberOfAyahs":11,"revelationType":"Medinan"},
    {"number":64,"name":"سُورَةُ ٱلتَّغَابُنِ","englishName":"At-Taghaabun","englishNameTranslation":"The Mutual Disillusion","numberOfAyahs":18,"revelationType":"Medinan"},
    {"number":65,"name":"سُورَةُ ٱلطَّلَاقِ","englishName":"At-Talaaq","englishNameTranslation":"The Divorce","numberOfAyahs":12,"revelationType":"Medinan"},
    {"number":66,"name":"سُورَةُ ٱلتَّحْرِيمِ","englishName":"At-Tahrim","englishNameTranslation":"The Prohibition","numberOfAyahs":12,"revelationType":"Medinan"},
    {"number":67,"name":"سُورَةُ ٱلْْمُلْكِ","englishName":"Al-Mulk","englishNameTranslation":"The Sovereignty","numberOfAyahs":30,"revelationType":"Meccan"},
    {"number":68,"name":"سُورَةُ ٱلْقَلَمِ","englishName":"Al-Qalam","englishNameTranslation":"The Pen","numberOfAyahs":52,"revelationType":"Meccan"},
    {"number":69,"name":"سُورَةُ ٱلْحَاقَّةِ","englishName":"Al-Haaqqa","englishNameTranslation":"The Reality","numberOfAyahs":52,"revelationType":"Meccan"},
    {"number":70,"name":"سُورَةُ ٱلْمَعَارِجِ","englishName":"Al-Ma'aarij","englishNameTranslation":"The Ascending Stairways","numberOfAyahs":44,"revelationType":"Meccan"},
    {"number":71,"name":"سُورَةُ نُوحٍ","englishName":"Nooh","englishNameTranslation":"Noah","numberOfAyahs":28,"revelationType":"Meccan"},
    {"number":72,"name":"سُورَةُ ٱلْجِنِّ","englishName":"Al-Jinn","englishNameTranslation":"The Jinn","numberOfAyahs":28,"revelationType":"Meccan"},
    {"number":73,"name":"سُورَةُ ٱلْمُزَّمِّلِ","englishName":"Al-Muzzammil","englishNameTranslation":"The Enshrouded One","numberOfAyahs":20,"revelationType":"Meccan"},
    {"number":74,"name":"سُورَةُ ٱلْمُدَّثِّرِ","englishName":"Al-Muddaththir","englishNameTranslation":"The Cloaked One","numberOfAyahs":56,"revelationType":"Meccan"},
    {"number":75,"name":"سُورَةُ ٱلْقِيَامَةِ","englishName":"Al-Qiyaama","englishNameTranslation":"The Resurrection","numberOfAyahs":40,"revelationType":"Meccan"},
    {"number":76,"name":"سُورَةُ ٱلْإِنْسَانِ","englishName":"Al-Insaan","englishNameTranslation":"Man","numberOfAyahs":31,"revelationType":"Medinan"},
    {"number":77,"name":"سُورَةُ ٱلْمُرْسَلَاتِ","englishName":"Al-Mursalaat","englishNameTranslation":"The Emissaries","numberOfAyahs":50,"revelationType":"Meccan"},
    {"number":78,"name":"سُورَةُ ٱلنَّبَإِ","englishName":"An-Naba","englishNameTranslation":"The Tidings","numberOfAyahs":40,"revelationType":"Meccan"},
    {"number":79,"name":"سُورَةُ ٱلنَّازِعَاتِ","englishName":"An-Naazi'aat","englishNameTranslation":"Those who drag forth","numberOfAyahs":46,"revelationType":"Meccan"},
    {"number":80,"name":"سُورَةُ عَبَسَ","englishName":"Abasa","englishNameTranslation":"He frowned","numberOfAyahs":42,"revelationType":"Meccan"},
    {"number":81,"name":"سُورَةُ ٱلتَّكْوِيرِ","englishName":"At-Takwir","englishNameTranslation":"The Overthrowing","numberOfAyahs":29,"revelationType":"Meccan"},
    {"number":82,"name":"سُورَةُ ٱلْإِنْفِطَارِ","englishName":"Al-Infitaar","englishNameTranslation":"The Cleaving","numberOfAyahs":19,"revelationType":"Meccan"},
    {"number":83,"name":"سُورَةُ ٱلْمُطَفِّفِينَ","englishName":"Al-Mutaffifin","englishNameTranslation":"The Defrauding","numberOfAyahs":36,"revelationType":"Meccan"},
    {"number":84,"name":"سُورَةُ ٱلْإِنْشِقَاقِ","englishName":"Al-Inshiqaaq","englishNameTranslation":"The Splitting Asunder","numberOfAyahs":25,"revelationType":"Meccan"},
    {"number":85,"name":"سُورَةُ ٱلْبُرُوجِ","englishName":"Al-Burooj","englishNameTranslation":"The Mansions of the Stars","numberOfAyahs":22,"revelationType":"Meccan"},
    {"number":86,"name":"سُورَةُ ٱلطَّارِقِ","englishName":"At-Taariq","englishNameTranslation":"The Nightcommer","numberOfAyahs":17,"revelationType":"Meccan"},
    {"number":87,"name":"سُورَةُ ٱلْأَعْلَىٰ","englishName":"Al-A'laa","englishNameTranslation":"The Most High","numberOfAyahs":19,"revelationType":"Meccan"},
    {"number":88,"name":"سُورَةُ ٱلْغَاشِيَةِ","englishName":"Al-Ghaashiya","englishNameTranslation":"The Overwhelming","numberOfAyahs":26,"revelationType":"Meccan"},
    {"number":89,"name":"سُورَةُ ٱلْفَجْرِ","englishName":"Al-Fajr","englishNameTranslation":"The Dawn","numberOfAyahs":30,"revelationType":"Meccan"},
    {"number":90,"name":"سُورَةُ ٱلْبَلَدِ","englishName":"Al-Balad","englishNameTranslation":"The City","numberOfAyahs":20,"revelationType":"Meccan"},
    {"number":91,"name":"سُورَةُ ٱلشَّمْسِ","englishName":"Ash-Shams","englishNameTranslation":"The Sun","numberOfAyahs":15,"revelationType":"Meccan"},
    {"number":92,"name":"سُورَةُ ٱللَّيْلِ","englishName":"Al-Lail","englishNameTranslation":"The Night","numberOfAyahs":21,"revelationType":"Meccan"},
    {"number":93,"name":"سُورَةُ ٱلضُّحَىٰ","englishName":"Ad-Dhuhaa","englishNameTranslation":"The Morning Hours","numberOfAyahs":11,"revelationType":"Meccan"},
    {"number":94,"name":"سُورَةُ ٱلشَّرْحِ","englishName":"Ash-Sharh","englishNameTranslation":"The Consolation","numberOfAyahs":8,"revelationType":"Meccan"},
    {"number":95,"name":"سُورَةُ ٱلتِّينِ","englishName":"At-Tin","englishNameTranslation":"The Fig","numberOfAyahs":8,"revelationType":"Meccan"},
    {"number":96,"name":"سُورَةُ ٱلْعَلَقِ","englishName":"Al-Alaq","englishNameTranslation":"The Clot","numberOfAyahs":19,"revelationType":"Meccan"},
    {"number":97,"name":"سُورَةُ ٱلْقَدْرِ","englishName":"Al-Qadr","englishNameTranslation":"The Power, Fate","numberOfAyahs":5,"revelationType":"Meccan"},
    {"number":98,"name":"سُورَةُ ٱلْبَيِّنَةِ","englishName":"Al-Bayyina","englishNameTranslation":"The Clear Proof","numberOfAyahs":8,"revelationType":"Medinan"},
    {"number":99,"name":"سُورَةُ ٱلزَّلْزَلَةِ","englishName":"Az-Zalzala","englishNameTranslation":"The Earthquake","numberOfAyahs":8,"revelationType":"Medinan"},
    {"number":100,"name":"سُورَةُ ٱلْعَادِيَاتِ","englishName":"Al-Aadiyaat","englishNameTranslation":"The Courser","numberOfAyahs":11,"revelationType":"Meccan"},
    {"number":101,"name":"سُورَةُ ٱلْقَارِعَةِ","englishName":"Al-Qaari'a","englishNameTranslation":"The Calamity","numberOfAyahs":11,"revelationType":"Meccan"},
    {"number":102,"name":"سُورَةُ ٱلتَّكَاثُرِ","englishName":"At-Takaathur","englishNameTranslation":"The Piling Up","numberOfAyahs":8,"revelationType":"Meccan"},
    {"number":103,"name":"سُورَةُ ٱلْعَصْرِ","englishName":"Al-Asr","englishNameTranslation":"The Time","numberOfAyahs":3,"revelationType":"Meccan"},
    {"number":104,"name":"سُورَةُ ٱلْهُمَزَةِ","englishName":"Al-Humaza","englishNameTranslation":"The Slanderer","numberOfAyahs":9,"revelationType":"Meccan"},
    {"number":105,"name":"سُورَةُ ٱلْفِيلِ","englishName":"Al-Fil","englishNameTranslation":"The Elephant","numberOfAyahs":5,"revelationType":"Meccan"},
    {"number":106,"name":"سُورَةُ قُرَيْشٍ","englishName":"Quraish","englishNameTranslation":"Quraysh","numberOfAyahs":4,"revelationType":"Meccan"},
    {"number":107,"name":"سُورَةُ ٱلْمَاعُونِ","englishName":"Al-Maa'un","englishNameTranslation":"The Small Kindnesses","numberOfAyahs":7,"revelationType":"Meccan"},
    {"number":108,"name":"سُورَةُ ٱلْكَوْثَرِ","englishName":"Al-Kawthar","englishNameTranslation":"The Abundance","numberOfAyahs":3,"revelationType":"Meccan"},
    {"number":109,"name":"سُورَةُ ٱلْكَافِرُونَ","englishName":"Al-Kaafiroon","englishNameTranslation":"The Disbelievers","numberOfAyahs":6,"revelationType":"Meccan"},
    {"number":110,"name":"سُورَةُ ٱلنَّصْرِ","englishName":"An-Nasr","englishNameTranslation":"The Divine Support","numberOfAyahs":3,"revelationType":"Medinan"},
    {"number":111,"name":"سُورَةُ ٱلْمَسَدِ","englishName":"Al-Masad","englishNameTranslation":"The Palm Fiber","numberOfAyahs":5,"revelationType":"Meccan"},
    {"number":112,"name":"سُورَةُ ٱلْإِخْلَاصِ","englishName":"Al-Ikhlaas","englishNameTranslation":"The Sincerity","numberOfAyahs":4,"revelationType":"Meccan"},
    {"number":113,"name":"سُورَةُ ٱلْفَلَقِ","englishName":"Al-Falaq","englishNameTranslation":"The Daybreak","numberOfAyahs":5,"revelationType":"Meccan"},
    {"number":114,"name":"سُورَةُ ٱلنَّاسِ","englishName":"An-Naas","englishNameTranslation":"Mankind","numberOfAyahs":6,"revelationType":"Meccan"}
];

// --- ICONS (unchanged) ---
const PlayIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z"/></svg>);
const PauseIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z"/></svg>);
const LoadingSpinnerIcon = () => (<div className="w-8 h-8 border-4 border-gray-300 border-t-[var(--color-primary)] rounded-full animate-spin"></div>);
const BookmarkIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"/></svg>);
const BookmarkFilledIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"/></svg>);
const HomeIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z"/><path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75-.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z"/></svg>);
const SearchIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>);
const SettingsIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const ChevronLeftIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>);
const HeadphonesIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>);
const BookIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" /></svg>);


// --- UTILITIES ---
const toEasternArabicNumerals = (num) => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).split('').map(digit => arabicNumerals[parseInt(digit, 10)] || '').join('');
};

const AyahEndSymbol = ({ number }) => (
  <span className="ayah-symbol font-semibold inline-flex items-center justify-center w-8 h-8 rounded-full mx-2 text-sm">
    {toEasternArabicNumerals(number)}
  </span>
);

// --- SETTINGS DATA ---
const JUZ_START_WORDS = [
  "الٓمٓ", "سَيَقُولُ ٱلسُّفَهَآءُ", "تِلْكَ ٱلرُّسُلُ", "لَن تَنَالُوا۟ ٱلْبِرَّ", "وَٱلْمُحْصَنَٰتُ",
  "لَّا يُحِبُّ ٱللَّهُ", "وَإِذَا سَمِعُوا۟", "وَلَوْ أَنَّنَا", "قَالَ ٱلْمَلَأُ", "وَٱعْلَمُوٓا۟",
  "يَعْتَذِرُونَ", "وَمَا مِن دَآبَّةٍ", "وَمَآ أُبَرِّئُ نَفْسِىٓ", "رُّبَمَا", "سُبْحَٰنَ ٱلَّذِىٓ",
  "قَالَ أَلَمْ", "ٱقْتَرَبَ لِلNَّاسِ", "قَدْ أَفْلَحَ", "وَقَالَ ٱلَّذِينَ", "أَمَّنْ خَلَقَ",
  "ٱتْلُ مَآ أُوحِىَ", "وَمَن يَقْنُتْ", "وَمَا لِىَ", "فَمَن أَظْلَمُ", "إِلَيْهِ يُرَدُّ",
  "حمٓ", "قَالَ فَمَا خَطْبُكُمْ", "قَدْ سَمِعَ ٱللَّهُ", "تَبَٰרَكَ ٱلَّذِى", "عَمَّ يَتَسَآءَلُونَ"
];

const VERIFIED_JUZ_STARTS = [
    { surah: 1, ayah: 1 },   // Juz 1
    { surah: 2, ayah: 142 }, // Juz 2
    { surah: 2, ayah: 253 }, // Juz 3
    { surah: 3, ayah: 93 },  // Juz 4
    { surah: 4, ayah: 24 },  // Juz 5
    { surah: 4, ayah: 148 }, // Juz 6
    { surah: 5, ayah: 82 },  // Juz 7
    { surah: 6, ayah: 111 }, // Juz 8
    { surah: 7, ayah: 88 },  // Juz 9
    { surah: 8, ayah: 41 },  // Juz 10
    { surah: 9, ayah: 93 },  // Juz 11
    { surah: 11, ayah: 6 },  // Juz 12
    { surah: 12, ayah: 53 }, // Juz 13
    { surah: 15, ayah: 1 },  // Juz 14
    { surah: 17, ayah: 1 },  // Juz 15
    { surah: 18, ayah: 75 }, // Juz 16
    { surah: 21, ayah: 1 },  // Juz 17
    { surah: 23, ayah: 1 },  // Juz 18
    { surah: 25, ayah: 21 }, // Juz 19
    { surah: 27, ayah: 56 }, // Juz 20
    { surah: 29, ayah: 46 }, // Juz 21
    { surah: 33, ayah: 31 }, // Juz 22
    { surah: 36, ayah: 28 }, // Juz 23
    { surah: 39, ayah: 32 }, // Juz 24
    { surah: 41, ayah: 47 }, // Juz 25
    { surah: 46, ayah: 1 },  // Juz 26
    { surah: 51, ayah: 31 }, // Juz 27
    { surah: 58, ayah: 1 },  // Juz 28
    { surah: 67, ayah: 1 },  // Juz 29
    { surah: 78, ayah: 1 }   // Juz 30
];

const QARIS = [{ id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' }, { id: 'ar.hudhaify', name: 'Ali Al-Hudhaify' }, { id: 'ar.mahermuaiqly', name: 'Maher Al Muaqily' }];
const THEMES = [{ id: 'serenity', name: 'Serenity' }, { id: 'sunrise', name: 'Sunrise' }, { id: 'majestic', name: 'Majestic' }, { id: 'sepia', name: 'Sepia' }, { id: 'olive', name: 'Olive' }, { id: 'midnight', name: 'Midnight' }];
const ARABIC_FONTS = [
    { id: 'kfgqpc-v2', name: 'KFGQPC V2 (Uthmani)' },
    { id: 'amiri', name: 'Amiri' },
    { id: 'lateef', name: 'Lateef' },
    { id: 'noto-naskh', name: 'Noto Naskh Arabic' },
    { id: 'scheherazade', name: 'Scheherazade New' },
];
const TRANSLATION_FONTS = [
    { id: 'inter', name: 'Inter', lang: 'english' },
    { id: 'roboto', name: 'Roboto', lang: 'english' },
    { id: 'lato', name: 'Lato', lang: 'english' },
    { id: 'poppins', name: 'Poppins', lang: 'english' },
    { id: 'noto-nastaliq', name: 'Noto Nastaliq', lang: 'urdu' },
    { id: 'gulzar', name: 'Gulzar', lang: 'urdu' },
];
const TRANSLATION_AUDIO_OPTIONS = [
    { id: 'none', name: 'Off' },
    { id: 'en.walk', name: 'English (Ibrahim Walk)' },
    { id: 'ur.khan', name: 'Urdu (Farhat Hashmi)' },
];

const DEFAULT_SETTINGS = {
    theme: 'olive',
    translationLanguage: 'urdu',
    qari: 'ar.alafasy',
    translationAudio: 'ur.khan',
    translationFont: 'gulzar',
    arabicFont: 'lateef',
    arabicFontSize: 30,
    translationFontSize: 15,
    arabicLineHeight: 1.5,
    translationLineHeight: 2.3,
};

// --- HOOKS ---
const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error("Error reading from localStorage", error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
  }, [key, state]);

  return [state, setState];
};

// --- REDESIGNED COMPONENTS ---

const SegmentedControl = ({ options, activeOption, onOptionClick }) => {
  const activeIndex = options.findIndex(opt => opt.id === activeOption);
  return (
    <div className="segmented-control-container">
      <div 
        className="segmented-control-indicator"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {options.map(option => (
        <button 
          key={option.id}
          onClick={() => onOptionClick(option.id)}
          className={`segmented-control-button ${activeOption === option.id ? 'active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

const Header = ({ title, onBack, icon, children }) => (
  <header className="app-header sticky top-0 z-40 h-16 flex items-center justify-between px-4">
    <div className="flex items-center space-x-2">
      {onBack && (
        <button onClick={onBack} className="p-2 -ml-2 mr-2 rounded-full hover:bg-[color-mix(in_srgb,_var(--color-primary)_10%,_transparent)]">
          <ChevronLeftIcon className="w-6 h-6 text-[var(--color-text-secondary)]"/>
        </button>
      )}
      {icon}
      <h1 className="text-xl font-bold font-poppins truncate">{title}</h1>
    </div>
    {children}
  </header>
);

const BottomNav = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'search', icon: SearchIcon, label: 'Search' },
    { id: 'bookmarks', icon: BookmarkIcon, label: 'Bookmarks' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];
  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 h-20 z-40">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-item flex flex-col items-center space-y-1 transition-colors duration-200 ${activeTab === item.id ? 'active' : 'text-[var(--color-text-secondary)]'}`}
          >
            <item.icon className="w-7 h-7" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const VerseCard = ({ verse, settings, onPlay, onBookmark, isBookmarked, isPlaying, isLoading, isHighlighted, isFirstVerse, isTranslationPlaying }) => {
    const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    let verseText = verse.text;

    if (isFirstVerse && verseText.startsWith(bismillah)) {
        verseText = verseText.substring(bismillah.length).trim();
    }

    return (
      <div className={`p-4 rounded-2xl transition-all duration-300 ${isHighlighted ? 'bg-[color-mix(in_srgb,_var(--color-primary)_8%,_transparent)] ring-2 ring-[var(--color-primary)]' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-sm themed-gradient-text">
            {verse.surah.englishName} {verse.numberInSurah}
          </span>
          <div className="flex items-center space-x-2">
            <button onClick={onBookmark} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
              {isBookmarked ? <BookmarkFilledIcon className="w-5 h-5 text-[var(--color-primary)]" /> : <BookmarkIcon className="w-5 h-5" />}
            </button>
            <button onClick={onPlay} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
              {isLoading ? <LoadingSpinnerIcon /> : isPlaying ? <PauseIcon className="w-5 h-5 text-[var(--color-primary)]" /> : <PlayIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <p dir="rtl" className={`text-right text-[var(--color-text-primary)] font-${settings.arabicFont} arabic-text mb-4`}>
          {verseText.replace(/[\u06dd\u0660-\u0669\s]+$/, '')}
          <AyahEndSymbol number={verse.numberInSurah} />
        </p>
        <div className={`translation-sub-card mt-4 p-4 rounded-xl transition-all duration-300 ${isTranslationPlaying ? 'ring-2 ring-[var(--color-primary)]' : ''}`}>
             <p className={`text-[var(--color-text-secondary)] font-${settings.translationFont} translation-text text-right`}>
              {settings.translationLanguage === 'urdu' ? verse.urduTranslation : verse.englishTranslation}
            </p>
        </div>
      </div>
    );
};


const AudioMiniPlayer = ({ surah, status, onTogglePlay, onNavigate }) => (
  <div className="fixed bottom-20 left-0 right-0 z-30 p-4 animate-slideInUp" onClick={onNavigate}>
    <div className="card flex items-center p-3 space-x-3 cursor-pointer">
      <div className="w-12 h-12 themed-gradient rounded-xl flex items-center justify-center text-white flex-shrink-0">
        <HeadphonesIcon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate font-poppins">{surah.englishName}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {status === 'playing' ? 'Playing...' : 'Paused'}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
        className="w-12 h-12 rounded-full flex items-center justify-center bg-[color-mix(in_srgb,_var(--color-primary)_10%,_transparent)] text-[var(--color-primary)]"
      >
        {status === 'playing' ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-0.5" />}
      </button>
    </div>
  </div>
);

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="card max-w-sm w-full p-6 text-center animate-scaleIn">
        <h3 className="text-xl font-bold font-poppins mb-2">{title}</h3>
        <p className="text-[var(--color-text-secondary)] mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="w-full text-center p-3 rounded-lg font-semibold bg-gray-500/10 text-[var(--color-text-secondary)] hover:bg-gray-500/20 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full text-center p-3 rounded-lg font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors duration-200"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};


// --- SCREENS ---
const HomeScreen = ({ surahs, juzs, settings, onSurahSelect, onJuzSelect, onPlaySurah, playbackState, lastRead, onContinueReading, homeView }) => {
  return (
    <div className="p-4 space-y-6">
      {lastRead && lastRead.surah && (
        <div onClick={onContinueReading} className="card p-6 themed-gradient text-white relative overflow-hidden cursor-pointer animate-scaleIn">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="relative z-10">
            <p className="font-semibold text-sm opacity-80 mb-1">CONTINUE READING</p>
            <h3 className="text-2xl font-bold font-poppins">{lastRead.surah.englishName}</h3>
            <p className="opacity-90">Verse {lastRead.verseNumberInSurah}</p>
          </div>
        </div>
      )}

      <div>
        {homeView === 'surahs' ? (
          <div className="space-y-3">
            {surahs.map((surah, index) => (
              <div key={surah.number} className="card p-4 flex items-center space-x-4 animate-slideInUp" style={{ animationDelay: `${index * 0.02}s` }}>
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[color-mix(in_srgb,_var(--color-primary)_10%,_transparent)] rounded-full font-bold themed-gradient-text">
                  {surah.number}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSurahSelect(surah)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold font-poppins truncate">{surah.englishName}</h4>
                      <p className="text-sm text-[var(--color-text-secondary)]">{surah.englishNameTranslation}</p>
                    </div>
                    <p className={`font-${settings.arabicFont} text-xl`}>{surah.name}</p>
                  </div>
                </div>
                <button onClick={() => onPlaySurah(surah)} className="p-2 rounded-full hover:bg-[color-mix(in_srgb,_var(--color-primary)_10%,_transparent)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
                  {playbackState.surahNumber === surah.number && playbackState.status === 'playing' ? <PauseIcon /> : <PlayIcon />}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
              {juzs.map((juz, index) => (
                  <div key={juz.number} onClick={() => onJuzSelect(juz)} className="card p-4 flex items-center space-x-4 cursor-pointer animate-slideInUp" style={{ animationDelay: `${index * 0.02}s` }}>
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[color-mix(in_srgb,_var(--color-primary)_10%,_transparent)] rounded-full font-bold themed-gradient-text">
                          {juz.number}
                      </div>
                      <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start">
                              <div>
                                  <h4 className={`font-${settings.arabicFont} text-2xl font-bold mb-1`}>{JUZ_START_WORDS[juz.number - 1]}</h4>
                                  <p className="text-sm text-[var(--color-text-secondary)] font-poppins">Juz' {juz.number}</p>
                              </div>
                              <p className={`font-${settings.arabicFont} text-xl text-[var(--color-text-secondary)]`}>{juz.startSurahNameArabic}</p>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SurahScreen = ({ surah, verses, settings, onPlayVerse, onBookmark, bookmarks, playbackState, verseRefs, scrollToVerse, onScrollComplete, loading }) => {
    useEffect(() => {
        if (scrollToVerse && verses.length > 0 && !loading) {
            const verseData = verses.find(v => v.number === scrollToVerse);
            if (verseData && verseRefs.current[verseData.number]) {
                setTimeout(() => {
                    verseRefs.current[verseData.number]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                    onScrollComplete();
                }, 100); 
            }
        }
    }, [scrollToVerse, verses, verseRefs, onScrollComplete, loading]);

    return (
        <div className="p-4 space-y-4">
            <div className="card p-6 text-center themed-gradient text-white space-y-2 animate-scaleIn">
                <h2 className="text-3xl font-bold font-poppins">{surah.englishName}</h2>
                <p className={`text-4xl font-${settings.arabicFont}`}>{surah.name}</p>
            
                <p className="opacity-90">{surah.englishNameTranslation}</p>
                <div className="flex justify-center space-x-4 pt-2">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">{surah.revelationType}</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">{surah.numberOfAyahs} Verses</span>
                </div>
                 {surah.number !== 1 && surah.number !== 9 && (
                    <p className="bismillah-text-card pt-2">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center pt-20"><LoadingSpinnerIcon/></div>
            ) : (
                <div className="space-y-4">
                    {verses.map((verse, index) => (
                        <div key={verse.number} ref={el => { verseRefs.current[verse.number] = el; }} className="animate-slideInUp" style={{ animationDelay: `${index * 0.02}s` }}>
                            <VerseCard
                                verse={verse}
                                settings={settings}
                                onPlay={() => onPlayVerse(verse)}
                                onBookmark={() => onBookmark(verse)}
                                isBookmarked={bookmarks.some(b => b.id === `${verse.surah.number}-${verse.numberInSurah}`)}
                                isPlaying={playbackState.currentVerseGlobal === verse.number && playbackState.status === 'playing'}
                                isLoading={playbackState.loadingVerse === verse.number}
                                isHighlighted={playbackState.status !== 'stopped' && playbackState.currentVerseGlobal === verse.number}
                                isFirstVerse={index === 0 && surah.number !== 1 && surah.number !== 9}
                                isTranslationPlaying={playbackState.currentVerseGlobal === verse.number && playbackState.stage === 'translation' && playbackState.status === 'playing'}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const JuzScreen = ({ juz, verses, settings, onPlayVerse, onBookmark, bookmarks, playbackState, verseRefs, loading, scrollToVerse, onScrollComplete }) => {
    useEffect(() => {
        if (scrollToVerse && verses.length > 0 && !loading) {
            const verseData = verses.find(v => v.number === scrollToVerse);
            if (verseData && verseRefs.current[verseData.number]) {
                setTimeout(() => {
                    verseRefs.current[verseData.number]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                    onScrollComplete();
                }, 100);
            }
        }
    }, [scrollToVerse, verses, verseRefs, onScrollComplete, loading]);
    
    return (
        <div className="p-4 space-y-4">
            <div className="card p-6 text-center themed-gradient text-white space-y-2 animate-scaleIn">
                <h2 className="text-3xl font-bold font-poppins">Juz' {juz.number}</h2>
                <p className={`text-4xl font-${settings.arabicFont}`}>{JUZ_START_WORDS[juz.number - 1]}</p>
                {!loading && verses.length > 0 && (
                     <p className="opacity-90">
                        {verses[0].surah.englishName}{verses[0].surah.number !== verses[verses.length-1].surah.number ? ` to ${verses[verses.length-1].surah.englishName}` : ''}
                    </p>
                )}
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center pt-20"><LoadingSpinnerIcon/></div>
            ) : (
                <div className="space-y-4">
                    {verses.map((verse, index) => (
                        <div key={verse.number} ref={el => { verseRefs.current[verse.number] = el; }} className="animate-slideInUp" style={{ animationDelay: `${index * 0.02}s` }}>
                            {
                                verse.numberInSurah === 1 && index > 0 && verse.surah.number !== 9 && (
                                    <p className="bismillah-text-card text-center text-2xl my-4 themed-gradient-text">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                                )
                            }
                            <VerseCard
                                verse={verse}
                                settings={settings}
                                onPlay={() => onPlayVerse(verse)}
                                onBookmark={() => onBookmark(verse)}
                                isBookmarked={bookmarks.some(b => b.id === `${verse.surah.number}-${verse.numberInSurah}`)}
                                isPlaying={playbackState.currentVerseGlobal === verse.number && playbackState.status === 'playing'}
                                isLoading={playbackState.loadingVerse === verse.number}
                                isHighlighted={playbackState.status !== 'stopped' && playbackState.currentVerseGlobal === verse.number}
                                isFirstVerse={verse.numberInSurah === 1 && verse.surah.number !== 1 && verse.surah.number !== 9}
                                isTranslationPlaying={playbackState.currentVerseGlobal === verse.number && playbackState.stage === 'translation' && playbackState.status === 'playing'}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const BookmarksScreen = ({ bookmarks, onBookmarkSelect, settings }) => (
  <div className="p-4">
    <h2 className="text-2xl font-bold font-poppins mb-4">Bookmarks</h2>
    {bookmarks.length > 0 ? (
      <div className="space-y-3">
        {bookmarks.map((bookmark, index) => (
          <div key={bookmark.id} onClick={() => onBookmarkSelect(bookmark)} className="card p-4 cursor-pointer animate-slideInUp" style={{ animationDelay: `${index * 0.03}s` }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold font-poppins">{bookmark.surahEnglishName}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Verse {bookmark.verseNumber}</p>
              </div>
              <p className={`font-${settings.arabicFont} text-xl`}>{bookmark.surahName}</p>
            </div>
            <p className={`mt-3 text-[var(--color-text-secondary)] font-${settings.translationFont} translation-text line-clamp-2 text-right`}>
              {settings.translationLanguage === 'urdu' ? bookmark.verseData.urduTranslation : bookmark.verseData.englishTranslation}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-20">
        <BookmarkIcon className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] mb-4" />
        <h3 className="text-xl font-bold font-poppins">No Bookmarks Yet</h3>
        <p className="text-[var(--color-text-secondary)] mt-1">Tap the bookmark icon on a verse to save it.</p>
      </div>
    )}
  </div>
);

const SearchScreen = () => (
    <div className="p-4">
        <h2 className="text-2xl font-bold font-poppins mb-4">Search</h2>
        <div className="relative">
          <input 
            type="text"
            placeholder="Search for a Surah or verse..."
            className="w-full p-4 pl-12 pr-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="w-6 h-6 text-[var(--color-text-secondary)]" />
          </div>
        </div>
        <div className="text-center py-20">
            <SearchIcon className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] mb-4" />
            <h3 className="text-xl font-bold font-poppins">Search Coming Soon</h3>
            <p className="text-[var(--color-text-secondary)] mt-1">This feature is currently under development.</p>
        </div>
    </div>
);

const SettingsPreviewCard = ({ settings }) => (
  <div className="p-4 mb-4 bg-[color-mix(in_srgb,var(--color-bg-card)_50%,var(--color-bg-main))] rounded-xl">
    <div style={{
      '--arabic-font-size': `${settings.arabicFontSize}px`,
      '--translation-font-size': `${settings.translationFontSize}px`,
      '--arabic-line-height': settings.arabicLineHeight,
      '--translation-line-height': settings.translationLineHeight,
    } as React.CSSProperties}>
      <p dir="rtl" className={`text-right text-[var(--color-text-primary)] font-${settings.arabicFont} arabic-text mb-4 transition-all duration-200`}>
        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        <AyahEndSymbol number={1} />
      </p>
      <p className={`text-[var(--color-text-secondary)] font-${settings.translationFont} translation-text transition-all duration-200 text-right`}>
        {settings.translationLanguage === 'urdu' ? 'شروع اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے' : 'In the name of Allah, the Entirely Merciful, the Especially Merciful.'}
      </p>
    </div>
  </div>
);

const SettingsScreen = ({ settings, onSettingChange, onReset }) => {
  const availableTranslationFonts = useMemo(() => TRANSLATION_FONTS.filter(f => f.lang === settings.translationLanguage), [settings.translationLanguage]);
  
  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4 card p-6">
        <h3 className="text-lg font-bold font-poppins">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {THEMES.map(theme => (
            <div key={theme.id} className="text-center">
              <button
                onClick={() => onSettingChange('theme', theme.id)}
                className={`w-12 h-12 rounded-full mx-auto transition-all duration-200 ${settings.theme === theme.id ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-card)] ring-[var(--color-primary)]' : ''}`}
                data-theme={theme.id}
              >
                <div className="w-full h-full rounded-full themed-gradient"></div>
              </button>
              <span className="text-sm mt-2 block">{theme.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4 card p-6">
        <h3 className="text-lg font-bold font-poppins">Appearance</h3>
        <SettingsPreviewCard settings={settings} />
        <div className="flex justify-between items-center">
          <label>Translation Language</label>
          <div className="flex rounded-lg p-1 bg-[color-mix(in_srgb,_var(--color-primary)_10%,_transparent)]">
            <button onClick={() => onSettingChange('translationLanguage', 'english')} className={`px-4 py-1 rounded-md text-sm font-semibold ${settings.translationLanguage === 'english' ? 'bg-[var(--color-primary)] text-white' : ''}`}>English</button>
            <button onClick={() => onSettingChange('translationLanguage', 'urdu')} className={`px-4 py-1 rounded-md text-sm font-semibold ${settings.translationLanguage === 'urdu' ? 'bg-[var(--color-primary)] text-white' : ''}`}>Urdu</button>
          </div>
        </div>
         <div>
          <label className="block mb-2">Arabic Font</label>
          <select value={settings.arabicFont} onChange={e => onSettingChange('arabicFont', e.target.value)} className="w-full p-3 rounded-lg bg-[var(--color-bg-main)] border border-[var(--color-border)]">
            {ARABIC_FONTS.map(font => <option key={font.id} value={font.id}>{font.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-2">Translation Font</label>
          <select value={settings.translationFont} onChange={e => onSettingChange('translationFont', e.target.value)} className="w-full p-3 rounded-lg bg-[var(--color-bg-main)] border border-[var(--color-border)]">
            {availableTranslationFonts.map(font => <option key={font.id} value={font.id}>{font.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-2">Arabic Font Size: {settings.arabicFontSize}px</label>
          <input type="range" min="20" max="50" value={settings.arabicFontSize} onChange={e => onSettingChange('arabicFontSize', +e.target.value)} className="w-full h-2 bg-[color-mix(in_srgb,_var(--color-primary)_20%,_transparent)] rounded-lg appearance-none cursor-pointer slider" style={{ background: `linear-gradient(to right, var(--color-primary) ${((settings.arabicFontSize - 20) / 30) * 100}%, color-mix(in srgb, var(--color-primary) 20%, transparent) ${((settings.arabicFontSize - 20) / 30) * 100}%)` }}/>
        </div>
         <div>
          <label className="block mb-2">Translation Font Size: {settings.translationFontSize}px</label>
          <input type="range" min="12" max="24" value={settings.translationFontSize} onChange={e => onSettingChange('translationFontSize', +e.target.value)} className="w-full h-2 bg-[color-mix(in_srgb,_var(--color-primary)_20%,_transparent)] rounded-lg appearance-none cursor-pointer slider" style={{ background: `linear-gradient(to right, var(--color-primary) ${((settings.translationFontSize - 12) / 12) * 100}%, color-mix(in srgb, var(--color-primary) 20%, transparent) ${((settings.translationFontSize - 12) / 12) * 100}%)` }}/>
        </div>
        <div>
          <label className="block mb-2">Arabic Line Height: {settings.arabicLineHeight}</label>
          <input type="range" min="1.5" max="4" step="0.1" value={settings.arabicLineHeight} onChange={e => onSettingChange('arabicLineHeight', +e.target.value)} className="w-full h-2 bg-[color-mix(in_srgb,_var(--color-primary)_20%,_transparent)] rounded-lg appearance-none cursor-pointer slider" style={{ background: `linear-gradient(to right, var(--color-primary) ${((settings.arabicLineHeight - 1.5) / 2.5) * 100}%, color-mix(in srgb, var(--color-primary) 20%, transparent) ${((settings.arabicLineHeight - 1.5) / 2.5) * 100}%)` }}/>
        </div>
        <div>
          <label className="block mb-2">Translation Line Height: {settings.translationLineHeight}</label>
          <input type="range" min="1.4" max="4" step="0.1" value={settings.translationLineHeight} onChange={e => onSettingChange('translationLineHeight', +e.target.value)} className="w-full h-2 bg-[color-mix(in_srgb,_var(--color-primary)_20%,_transparent)] rounded-lg appearance-none cursor-pointer slider" style={{ background: `linear-gradient(to right, var(--color-primary) ${((settings.translationLineHeight - 1.4) / 2.6) * 100}%, color-mix(in srgb, var(--color-primary) 20%, transparent) ${((settings.translationLineHeight - 1.4) / 2.6) * 100}%)` }}/>
        </div>
      </div>
      <div className="space-y-4 card p-6">
        <h3 className="text-lg font-bold font-poppins">Audio</h3>
        <div>
          <label className="block mb-2">Qari (Reciter)</label>
          <select value={settings.qari} onChange={e => onSettingChange('qari', e.target.value)} className="w-full p-3 rounded-lg bg-[var(--color-bg-main)] border border-[var(--color-border)]">
            {QARIS.map(qari => <option key={qari.id} value={qari.id}>{qari.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-2">Translation Audio</label>
          <select value={settings.translationAudio} onChange={e => onSettingChange('translationAudio', e.target.value)} className="w-full p-3 rounded-lg bg-[var(--color-bg-main)] border border-[var(--color-border)]">
            {TRANSLATION_AUDIO_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
          </select>
        </div>
      </div>
      <div className="card p-6">
        <button
          onClick={onReset}
          className="w-full text-center p-3 rounded-lg font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors duration-200"
        >
          Reset Settings
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const QuranApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [homeView, setHomeView] = useState('surahs');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<Juz | null>(null);
  
  const [surahs, setSurahs] = useState<Surah[]>(ALL_SURAHS);
  const [juzs, setJuzs] = useState<Juz[]>(() => 
      VERIFIED_JUZ_STARTS.map((start, index) => {
          const surahInfo = ALL_SURAHS.find(s => s.number === start.surah);
          return {
              number: index + 1,
              surah: start.surah,
              ayah: start.ayah,
              startSurahName: surahInfo ? surahInfo.englishName : '',
              startSurahNameArabic: surahInfo ? surahInfo.name : '',
          };
      })
  );

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [scrollToVerse, setScrollToVerse] = useState<number | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  
  const [settings, setSettings] = usePersistentState('quranAppSettings', DEFAULT_SETTINGS);

  const [bookmarks, setBookmarks] = usePersistentState<Bookmark[]>('quranAppBookmarks', []);
  const [lastRead, setLastRead] = usePersistentState<LastRead | null>('quranAppLastRead', null);

  const [playbackState, setPlaybackState] = useState({
    surahNumber: null,
    currentVerseIndex: 0,
    currentVerseGlobal: null,
    status: 'stopped', // playing, paused, stopped
    loadingVerse: null,
    stage: 'arabic', // 'arabic' or 'translation'
  });
  const [playbackContext, setPlaybackContext] = useState<{ type: 'surah' | 'juz', data: Surah | Juz } | null>(null);

  const audioRef = useRef < HTMLAudioElement | null > (null);
  const verseRefs = useRef < Record < number, HTMLDivElement | null >> ({});
  const preloadedUrlsRef = useRef(new Set());
  const handleSettingChange = useCallback((key, value) => setSettings(p => ({ ...p, [key]: value })), [setSettings]);

  const handleConfirmReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setShowResetConfirmModal(false);
  };

  // --- Effects ---
  useEffect(() => {
    // App-wide cleanup
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  // Migration for old Urdu audio setting
  useEffect(() => {
    if (settings.translationAudio === 'ur.jalandhry' || settings.translationAudio === 'ur.shamshadalkhan') {
        handleSettingChange('translationAudio', 'ur.khan');
    }
  }, [handleSettingChange, settings.translationAudio]);

  useEffect(() => {
    // If user has audio on, sync it with the text language
    if (settings.translationAudio !== 'none') {
        if (settings.translationLanguage === 'english' && settings.translationAudio !== 'en.walk') {
            handleSettingChange('translationAudio', 'en.walk');
        } else if (settings.translationLanguage === 'urdu' && settings.translationAudio !== 'ur.khan') {
            handleSettingChange('translationAudio', 'ur.khan');
        }
    }
  }, [settings.translationLanguage, settings.translationAudio, handleSettingChange]);

  useEffect(() => {
    document.documentElement.style.setProperty('--arabic-font-size', `${settings.arabicFontSize}px`);
    document.documentElement.style.setProperty('--translation-font-size', `${settings.translationFontSize}px`);
    document.documentElement.style.setProperty('--arabic-line-height', `${settings.arabicLineHeight}`);
    document.documentElement.style.setProperty('--translation-line-height', `${settings.translationLineHeight}`);
  }, [settings.arabicFontSize, settings.translationFontSize, settings.arabicLineHeight, settings.translationLineHeight]);

  useEffect(() => {
    const relevantFont = TRANSLATION_FONTS.find(f => f.lang === settings.translationLanguage && f.id === settings.translationFont);
    if (!relevantFont) {
        const defaultFont = TRANSLATION_FONTS.find(f => f.lang === settings.translationLanguage);
        if (defaultFont) handleSettingChange('translationFont', defaultFont.id);
    }
  }, [settings.translationLanguage, settings.translationFont, handleSettingChange]);
  
  // --- Data Loading ---
   const surahStartVerseMap = useMemo(() => {
    if (surahs.length === 0) return {};
    const map = {};
    let currentVerse = 1;
    const sortedSurahs = [...surahs].sort((a, b) => a.number - b.number);
    for (const surah of sortedSurahs) {
      map[surah.number] = currentVerse;
      currentVerse += surah.numberOfAyahs;
    }
    return map;
  }, [surahs]);

  const juzBoundaries = useMemo(() => {
    if (surahs.length === 0) return [];
    const surahAyahCounts = surahs.reduce((acc, s) => ({ ...acc, [s.number]: s.numberOfAyahs }), {});
    
    return VERIFIED_JUZ_STARTS.map((start, index) => {
      let end;
      if (index === VERIFIED_JUZ_STARTS.length - 1) {
        end = { surah: 114, ayah: 6 };
      } else {
        const nextStart = VERIFIED_JUZ_STARTS[index + 1];
        if (nextStart.ayah === 1) {
          const prevSurahNumber = nextStart.surah - 1;
          end = { surah: prevSurahNumber, ayah: surahAyahCounts[prevSurahNumber] };
        } else {
          end = { surah: nextStart.surah, ayah: nextStart.ayah - 1 };
        }
      }
      return { start, end };
    });
  }, [surahs]);

  const loadVerses = useCallback(async ({ surah, juz }: { surah?: Surah, juz?: Juz }) => {
    setLoading(true);
    setVerses([]);
    verseRefs.current = {};
    preloadedUrlsRef.current.clear();

    const fetchFromAlquranCloud = async () => {
      const type = surah ? 'surah' : 'juz';
      const number = surah ? surah.number : juz!.number;
      
      const [arabicRes, englishRes, urduRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/${type}/${number}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/${type}/${number}/en.asad`),
        fetch(`https://api.alquran.cloud/v1/${type}/${number}/ur.jalandhry`)
      ]);
      const [arabic, english, urdu] = await Promise.all([arabicRes.json(), englishRes.json(), urduRes.json()]);

      if (arabic.code !== 200) throw new Error('Alquran.cloud API failed');
      
      const combined = arabic.data.ayahs.map((v, i) => ({ 
          ...v, 
          englishTranslation: english.data.ayahs[i]?.text || '', 
          urduTranslation: urdu.data.ayahs[i]?.text || '',
          ...(surah && { surah })
      }));
      return combined;
    };

    const fetchFromQuranCom = async () => {
        const fetchSurah = async (surahNumber) => {
            const [arabicRes, englishRes, urduRes] = await Promise.all([
                fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surahNumber}`).then(res => res.json()),
                fetch(`https://api.quran.com/api/v4/quran/translations/21?chapter_number=${surahNumber}`).then(res => res.json()), // en.asad
                fetch(`https://api.quran.com/api/v4/quran/translations/85?chapter_number=${surahNumber}`).then(res => res.json()), // ur.jalandhry
            ]);

            const surahData = surahs.find(s => s.number === surahNumber);
            if (!surahData) throw new Error(`Surah data for ${surahNumber} not found`);

            const startVerse = surahStartVerseMap[surahNumber];
            return arabicRes.verses.map((v, i) => ({
                number: startVerse + i,
                numberInSurah: v.id,
                text: v.text_uthmani,
                englishTranslation: englishRes.translations[i]?.text || '',
                urduTranslation: urduRes.translations[i]?.text || '',
                surah: surahData,
            }));
        };

        if (surah) {
            return await fetchSurah(surah.number);
        }

        if (juz) {
            const boundary = juzBoundaries[juz.number - 1];
            if (!boundary) throw new Error("Juz boundary not found");
            const { start, end } = boundary;
            let allJuzVerses = [];

            for (let sNum = start.surah; sNum <= end.surah; sNum++) {
                const surahData = surahs.find(s => s.number === sNum);
                const surahVerses = await fetchSurah(sNum);
                
                const startAyah = (sNum === start.surah) ? start.ayah : 1;
                const endAyah = (sNum === end.surah) ? end.ayah : surahData.numberOfAyahs;

                const filteredVerses = surahVerses.filter(v => 
                    v.numberInSurah >= startAyah && v.numberInSurah <= endAyah
                );
                allJuzVerses.push(...filteredVerses);
            }
            return allJuzVerses;
        }
        
        throw new Error("Invalid parameters for fetchFromQuranCom");
    };
    
    try {
        const verseData = await fetchFromAlquranCloud();
        setVerses(verseData);
        return verseData;
    } catch (e) {
        console.error("Primary verse provider failed, trying fallback.", e);
        try {
            const verseData = await fetchFromQuranCom();
            setVerses(verseData);
            return verseData;
        } catch (e2) {
            console.error("All verse providers failed.", e2);
            return null;
        }
    } finally {
        setLoading(false);
    }
  }, [surahs, surahStartVerseMap, juzBoundaries]);


  // --- Audio Logic ---
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
    }
    setPlaybackState({ surahNumber: null, currentVerseIndex: 0, currentVerseGlobal: null, status: 'stopped', loadingVerse: null, stage: 'arabic' });
    setPlaybackContext(null);
    preloadedUrlsRef.current.clear();
  }, []);
  
  useEffect(() => {
    const verseToPlay = verses[playbackState.currentVerseIndex];

    if (playbackState.status !== 'playing' || !verseToPlay) {
        if (audioRef.current && !audioRef.current.paused && audioRef.current.src) {
             try {
                audioRef.current.pause();
             } catch(e) {
                console.warn("Could not pause audio:", e)
             }
        }
        return;
    }
     // --- PRE-LOADING LOGIC ---
    const preloadUrls = [];
    const PRELOAD_COUNT = 3; 

    if (playbackState.stage === 'arabic' && settings.translationAudio !== 'none') {
        const translationUrl = `https://cdn.alquran.cloud/media/audio/ayah/${settings.translationAudio}/${verseToPlay.number}`;
        preloadUrls.push(translationUrl);
    }

    for (let i = 1; i <= PRELOAD_COUNT; i++) {
        const nextVerse = verses[playbackState.currentVerseIndex + i];
        if (!nextVerse) break;

        const arabicUrl = `https://cdn.alquran.cloud/media/audio/ayah/${settings.qari}/${nextVerse.number}`;
        preloadUrls.push(arabicUrl);

        if (settings.translationAudio !== 'none') {
            const translationUrl = `https://cdn.alquran.cloud/media/audio/ayah/${settings.translationAudio}/${nextVerse.number}`;
            preloadUrls.push(translationUrl);
        }
    }
    
    preloadUrls.forEach(url => {
        if (!preloadedUrlsRef.current.has(url)) {
            const audio = new Audio();
            audio.src = url;
            preloadedUrlsRef.current.add(url);
        }
    });
     // --- END PRE-LOADING ---

    const isTranslationStage = playbackState.stage === 'translation' && settings.translationAudio !== 'none';
    const audioIdentifier = isTranslationStage ? settings.translationAudio : settings.qari;
    const audioSrc = `https://cdn.alquran.cloud/media/audio/ayah/${audioIdentifier}/${verseToPlay.number}`;

    const playAudio = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        } else {
            audioRef.current.pause();
        }
        
        audioRef.current.src = audioSrc;
        setPlaybackState(prev => ({ ...prev, loadingVerse: verseToPlay.number, currentVerseGlobal: verseToPlay.number }));
        
        const currentSurah = surahs.find(s => s.number === verseToPlay.surah.number)
        if (currentSurah) {
            setLastRead({ surah: currentSurah, verseNumberInSurah: verseToPlay.numberInSurah });
        }

        audioRef.current.oncanplaythrough = () => {
            setPlaybackState(prev => ({ ...prev, loadingVerse: null }));
        };
        
        const advancePlayback = () => {
             if (playbackState.stage === 'arabic' && settings.translationAudio !== 'none') {
                setPlaybackState(prev => ({ ...prev, stage: 'translation' }));
            } else {
                const nextVerseIndex = playbackState.currentVerseIndex + 1;
                if (nextVerseIndex < verses.length) {
                    const nextVerse = verses[nextVerseIndex];
                    setPlaybackState(prev => ({ 
                        ...prev, 
                        currentVerseIndex: nextVerseIndex, 
                        stage: 'arabic',
                        surahNumber: nextVerse.surah.number,
                        currentVerseGlobal: nextVerse.number,
                    }));
                } else {
                    stopPlayback();
                }
            }
        };

        audioRef.current.onended = advancePlayback;
        
        audioRef.current.onerror = () => {
            console.error(`Failed to load audio for verse ${verseToPlay.number}, skipping.`);
            advancePlayback();
        };

        audioRef.current.play().catch(e => {
            if (e.name !== 'AbortError') console.error("Audio play failed:", e);
        });
    };

    if (audioRef.current?.src.endsWith(`${audioIdentifier}/${verseToPlay.number}`)) {
        if (audioRef.current.paused) {
            audioRef.current.play().catch(e => {
                if (e.name !== 'AbortError') console.error("Audio play failed:", e);
            });
        }
    } else {
        playAudio();
    }
    
    verseRefs.current[verseToPlay.number]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  }, [playbackState.status, playbackState.currentVerseIndex, playbackState.stage, verses, settings.qari, settings.translationAudio, surahs, stopPlayback, setLastRead]);


  // --- Handlers ---
  
  const handleSurahSelect = (surah: Surah, options: { isNavigation?: boolean } = {}) => {
    if (!options.isNavigation) {
        stopPlayback();
        loadVerses({ surah });
    }
    setSelectedSurah(surah);
    setSelectedJuz(null);
    setActiveTab('surah');
  };
  
  const handleJuzSelect = (juz: Juz, options: { isNavigation?: boolean } = {}) => {
    if (!options.isNavigation) {
        stopPlayback();
        loadVerses({ juz });
    }
    setSelectedJuz(juz);
    setSelectedSurah(null);
    setActiveTab('juz');
  };

  const handleScrollComplete = useCallback(() => setScrollToVerse(null), []);

  const handlePlaySurah = async (surah) => {
    if (playbackState.surahNumber === surah.number && playbackContext?.type === 'surah' && (playbackContext.data as Surah).number === surah.number) {
        setPlaybackState(p => ({ ...p, status: p.status === 'playing' ? 'paused' : 'playing' }));
        return;
    }

    stopPlayback();
    setPlaybackContext({ type: 'surah', data: surah });
    
    const targetVerses = (verses.length > 0 && verses[0].surah.number === surah.number) 
        ? verses 
        : await loadVerses({ surah });
    
    if (targetVerses && targetVerses.length > 0) {
        setPlaybackState({ surahNumber: surah.number, currentVerseIndex: 0, status: 'playing', loadingVerse: null, currentVerseGlobal: targetVerses[0].number, stage: 'arabic' });
    }
  };

  const handlePlaySingleVerse = (verse: Verse) => {
    const verseIndex = verses.findIndex(v => v.number === verse.number);
    if (verseIndex === -1) return;
    
    if (playbackState.currentVerseGlobal === verse.number) {
        // Toggle play/pause for the currently selected verse
        setPlaybackState(p => ({...p, status: p.status === 'playing' ? 'paused' : 'playing' }));
    } else {
        // Set context before playing a new verse
        if(activeTab === 'surah' && selectedSurah) {
            setPlaybackContext({ type: 'surah', data: selectedSurah });
        } else if (activeTab === 'juz' && selectedJuz) {
            setPlaybackContext({ type: 'juz', data: selectedJuz });
        }
        
        setPlaybackState({
            surahNumber: verse.surah.number,
            currentVerseIndex: verseIndex,
            status: 'playing',
            loadingVerse: null,
            currentVerseGlobal: verse.number,
            stage: 'arabic'
        });
    }
  };
  
  const toggleBookmark = (verse: Verse) => {
    const id = `${verse.surah.number}-${verse.numberInSurah}`;
    setBookmarks(prev => 
      prev.some(b => b.id === id) 
      ? prev.filter(b => b.id !== id) 
      : [...prev, { id, surahName: verse.surah.name, surahNumber: verse.surah.number, surahEnglishName: verse.surah.englishName, verseNumber: verse.numberInSurah, verseData: verse }]
    );
  };
  
  const handleBookmarkSelect = (bookmark: Bookmark) => {
    const surah = surahs.find(s => s.number === bookmark.surahNumber);
    if (surah) {
        handleSurahSelect(surah);
        setScrollToVerse(bookmark.verseData.number);
    }
  };

  const handleContinueReading = () => {
      if (lastReadWithData && lastReadWithData.surah) {
          handleSurahSelect(lastReadWithData.surah);
          const surahNum = lastReadWithData.surah.number;
          if(surahStartVerseMap[surahNum]){
            const globalVerseNum = surahStartVerseMap[surahNum] + lastReadWithData.verseNumberInSurah - 1;
            setScrollToVerse(globalVerseNum);
          }
      }
  };

  const handleNavigateToPlayer = () => {
    if (!playbackContext || !playbackState.currentVerseGlobal) return;

    if (playbackContext.type === 'surah') {
        handleSurahSelect(playbackContext.data as Surah, { isNavigation: true });
    } else if (playbackContext.type === 'juz') {
        handleJuzSelect(playbackContext.data as Juz, { isNavigation: true });
    }
    
    setScrollToVerse(playbackState.currentVerseGlobal);
  };

  const lastReadWithData = useMemo(() => {
      if (!lastRead) return null;
      const surahData = surahs.find(s => s.number === (lastRead.surah?.number || lastRead.surahNumber));
      return surahData ? { ...lastRead, surah: surahData } : lastRead;
  }, [lastRead, surahs]);

  const playingSurah = playbackState.currentVerseGlobal ? surahs.find(s => s.number === playbackState.surahNumber) : null;

  const isPlayerUiVisible = useMemo(() => {
    if (!playingSurah || playbackState.status === 'stopped' || activeTab === 'settings') {
        return false;
    }
    if (playbackContext?.type === 'surah' && activeTab === 'surah' && selectedSurah?.number === (playbackContext.data as Surah).number) {
        return false;
    }
    if (playbackContext?.type === 'juz' && activeTab === 'juz' && selectedJuz?.number === (playbackContext.data as Juz).number) {
        return false;
    }
    return true;
  }, [activeTab, selectedSurah, selectedJuz, playingSurah, playbackState.status, playbackContext]);

  // --- Render Logic ---
  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen homeView={homeView} surahs={surahs} juzs={juzs} settings={settings} onSurahSelect={handleSurahSelect} onJuzSelect={handleJuzSelect} onPlaySurah={handlePlaySurah} playbackState={playbackState} lastRead={lastReadWithData} onContinueReading={handleContinueReading} />;
      case 'surah': return selectedSurah ? <SurahScreen loading={loading} surah={selectedSurah} verses={verses} settings={settings} onPlayVerse={handlePlaySingleVerse} onBookmark={toggleBookmark} bookmarks={bookmarks} playbackState={playbackState} verseRefs={verseRefs} scrollToVerse={scrollToVerse} onScrollComplete={handleScrollComplete} /> : null;
      case 'juz': return selectedJuz ? <JuzScreen loading={loading} juz={selectedJuz} verses={verses} settings={settings} onPlayVerse={handlePlaySingleVerse} onBookmark={toggleBookmark} bookmarks={bookmarks} playbackState={playbackState} verseRefs={verseRefs} scrollToVerse={scrollToVerse} onScrollComplete={handleScrollComplete} /> : null;
      case 'bookmarks': return <BookmarksScreen bookmarks={bookmarks} onBookmarkSelect={handleBookmarkSelect} settings={settings} />;
      case 'search': return <SearchScreen />;
      case 'settings': return <SettingsScreen settings={settings} onSettingChange={handleSettingChange} onReset={() => setShowResetConfirmModal(true)} />;
      default: return <HomeScreen homeView={homeView} surahs={surahs} juzs={juzs} settings={settings} onSurahSelect={handleSurahSelect} onJuzSelect={handleJuzSelect} onPlaySurah={handlePlaySurah} playbackState={playbackState} lastRead={lastReadWithData} onContinueReading={handleContinueReading} />;
    }
  };

  const getHeaderTitle = () => {
    if (activeTab === 'home') return 'Quran-e-Urdu';
    if (activeTab === 'settings') return 'Settings';
    if (activeTab === 'surah' && selectedSurah) return selectedSurah.englishName;
    if (activeTab === 'juz' && selectedJuz) return `Juz' ${selectedJuz.number}`;
    return 'Quran-e-Urdu';
  };
  
  return (
    <div className="app-container min-h-screen" data-theme={settings.theme}>
      <Header
        title={getHeaderTitle()}
        onBack={(activeTab === 'surah' || activeTab === 'juz') ? () => setActiveTab('home') : null}
        icon={activeTab === 'home' ? <BookIcon className="w-7 h-7 text-[var(--color-primary)]" /> : null}
      >
        {activeTab === 'home' && (
            <SegmentedControl 
                options={[{id: 'surahs', label: 'Surahs'}, {id: 'juz', label: "Juz'"}]}
                activeOption={homeView}
                onOptionClick={setHomeView}
            />
        )}
      </Header>
      <main className="pb-24">
        {renderContent()}
      </main>
      {isPlayerUiVisible &&
        <AudioMiniPlayer
          surah={playingSurah}
          status={playbackState.status}
          onTogglePlay={() => setPlaybackState(p => ({...p, status: p.status === 'playing' ? 'paused' : 'playing' }))}
          onNavigate={handleNavigateToPlayer}
        />
      }
       <ConfirmationModal
        isOpen={showResetConfirmModal}
        title="Reset Settings?"
        message="Are you sure you want to reset all settings to their default values? This action cannot be undone."
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirmModal(false)}
      />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<QuranApp />);