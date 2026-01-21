import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, SafeAreaView, View as RNView, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface UserProfile {
  birthDate: string;
}

interface DailyInsight {
  date: string;
  content: string;
}

const PROFILE_KEY = 'ikide_profile';
const INSIGHTS_KEY = 'ikide_insights';
const REVEAL_KEY = 'ikide_last_reveal_date';

const PRESET_INSIGHTS = [
  "生如夏花之絢爛，死如秋葉之靜美。",
  "這世界我來過，我愛過，我努力過。",
  "死亡不是失去生命，而是走出時間。",
  "每一個不曾起舞的日子，都是對生命的辜負。",
  "人生的意義在於內心的寧靜。",
  "我們最終都會成為星塵。",
  "活在當下，便是永恆。",
  "生命是穿堂風，攜花香也載塵埃。",
"心有山海，靜而無邊。",
"時光不語，卻回答所有問題。",
"與自己和解，是終身的修行。",
"風過無痕，心留餘溫，便是來過。",
"平凡的日子，藏著最珍貴的安穩。",
"執念如藤，纏了歲月，困了自己。",
"抬頭見月，便是人間好時節。",
"生命的厚度，在於經歷而非長度。",
"放下不是遺忘，是溫柔的安放。",
"萬物皆有歸途，人心亦有棲處。",
"心無雜念，風也溫柔，雨也從容。",
"歲月煮雨，時光蒸霜，皆為尋常。",
"做自己的光，不必借誰的亮。",
"離別是渡口，重逢是星光。",
"人生如寄，且行且珍惜。",
"靜賞花開，淡看花落，順應本心。",
"思想的自由，是最高的自由。",
"塵埃落定，方見本心澄澈。",
"愛不是占有，是彼此的成全。",
"歲月沉香，那些遺憾皆成過往。",
"心有丘壑，眼存山河，步履不停。",
"死亡是歸途，而非終點。",
"每一縷風，都藏著時光的秘密。",
"簡單做事，乾淨做人，不負此生。",
"月光所照，皆是故鄉；心之所向，皆是晴朗。",
"執念放下，天地皆寬。",
"生命如詩，一半煙火，一半清歡。",
"時光荏苒，唯初心不可負。",
"沉默是一種力量，不爭是一種智慧。",
"萬物有靈，眾生平等，各自燦爛。",
"人生沒有白走的路，每一步都算數。",
"心若不動，風又奈何；你若不傷，歲月無恙。",
"歲月清淺，安然向暖。",
"失去的都是風景，留下的才是人生。",
"以溫柔待世界，以從容度餘生。",
"星星落幕，朝陽升起，循環往復，便是永恆。",
"內心的豐盈，勝過世間萬千繁華。",
"人生如旅，遇人無數，知己二三，足以慰風塵。",
"放下過往，才能輕裝前行。",
"風遇山止，船到岸停，心向遠方。",
"時光是良藥，治癒所有傷痛。",
"做一個安靜的人，不慌不忙，向陽生長。",
"生命的意義，在於熱愛與堅守。",
"雲卷雲舒，花開花落，皆是自然。",
"心有暖陽，何懼風霜。",
"歲月無聲，卻在心上刻下痕跡。",
"真正的強大，是內心的從容不迫。",
"人生如茶，先苦後甘，回味悠長。",
"離別教會我們珍惜，遺憾教會我們成長。",
"萬物皆有輪回，生命自有節律。",
"心無旁騖，方能行穩致遠。",
"時光慢走，讓溫柔住進心裡。",
"愛如微光，雖弱，卻能照亮前路。",
"人生的美好，在於不期而遇的溫暖。",
"放下執念，方能遇見更好的自己。",
"山河遼闊，人間煙火，值得奔赴。",
"生命如燭，燃盡自己，照亮他人。",
"歲月不居，時節如流，且行且惜。",
"內心的平靜，是最珍貴的財富。",
"風有約，花不誤，歲歲如此，永不相負。",
"人生沒有標準答案，自在隨心就好。",
"時光會篩選出真正重要的人。",
"心有熱愛，眼中有光，腳下有路。",
"死亡是另一種開始，歸於塵土，滋養新生。",
"平凡的堅守，勝過轟轟烈烈的敷衍。",
"歲月沉香，初心未改。",
"心若向陽，無畏悲傷。",
"每一次告別，都是為了更好的遇見。",
"人生如書，翻開是故事，合上是回憶。",
"萬物共生，相互滋養，便是圓滿。",
"時光溫柔，善待每一個努力的人。",
"放下過去，擁抱當下，期待未來。",
"真正的自由，是心靈的無拘無束。",
"花開花謝總有時，相逢相聚本無意。",
"人生如棋，落子無悔，步步為營。",
"心有清歡，歲月安然。",
"時光不語，靜待花開。",
"生命的美好，在於不完美中的圓滿。",
"愛與被愛，是生命最美的饋贈。",
"風過林梢，月落肩頭，歲月靜好。",
"人生的智慧，在於取捨之間。",
"時光匆匆，別錯過身邊的風景。",
"心無雜念，方能感受世間美好。",
"死亡不是終點，遺忘才是。",
"以清淨心看世界，以歡喜心過生活。",
"歲月漫長，總有不期而遇的溫柔。",
"生命如河，奔湧向前，永不停歇。",
"放下執念，天地皆寬，萬物可愛。",
"人生如旅，在乎的不是目的地，而是沿途的風景。",
"星光不問趕路人，時光不負有心人。",
"心有山海，靜而不爭。",
"歲月磨平棱角，卻沉澱下溫柔。",
"生命的意義，在於創造與奉獻。",
"雲聚雲散，緣來緣去，皆是天意。",
"做自己的擺渡人，不依賴，不攀附。",
"時光清淺，許你安然。",
"真正的成熟，是接納不完美的自己。",
"生命如草，堅韌不拔，向陽而生。",
"放下煩惱，擁抱陽光，不負韶華。",
"風裡藏著故事，雨裡帶著溫柔。",
"人生沒有白吃的苦，每一份堅持都有意義。",
"時光會治癒所有傷痛，也會沉澱所有溫柔。",
"心有暖陽，歲月沉香。",
"死亡是回歸自然，與萬物相融。",
"平凡的日子，也能開出詩意的花。",
"歲月不饒人，我亦未曾饒過歲月。",
"心若不動，萬事從容。",
"每一次努力，都是在靠近更好的自己。",
"人生如酒，越品越香，越沉越醇。",
"萬物皆有裂痕，那是光照進來的地方。",
"時光匆匆，願我們都能不負此生。",
"放下過去的遺憾，珍惜當下的擁有。",
"真正的幸福，是內心的豐盈與安寧。",
"花謝花飛飛滿天，紅消香斷有誰憐，皆是因果。",
"人生如戲，戲如人生，認真對待便是圓滿。",
"心有清歡，不染塵埃。",
"時光溫柔，歲月靜好，安然無恙。",
"生命的力量，在於不屈不撓的堅守。",
"愛如春風，溫暖人心，治癒歲月。",
"風過無痕，歲月有聲。",
"人生的智慧，在於懂得適時止損。",
"時光流逝，初心不改，熱愛不變。",
"心無旁騖，專注當下，便是修行。",
"死亡不是失去，而是換一種方式存在。",
"以溫柔待己，以善意待人。",
"歲月沉香，那些時光都值得珍藏。",
"心若向陽，處處是風景。",
"每一次相遇，都是命中注定的緣分。",
"人生如路，曲曲折折，終會抵達。",
"萬物生長，自有其時，不必慌張。",
"時光會見證所有的努力與堅守。",
"放下執念，方能心無掛礙，自在前行。",
"真正的強大，是能承受所有風雨，依然向陽。",
"月有陰晴圓缺，人有悲歡離合，此事古難全。",
"人生如茶，慢慢品，靜靜悟。",
"心有山海，不負韶華。",
"時光清歡，歲月安然。",
"生命的美好，在於煙火氣中的溫暖。",
"愛與責任，是生命最美的底色。",
"風遇繁花，月遇星辰，皆是圓滿。",
"人生沒有捷徑，腳踏實地才是真理。",
"時光匆匆，別讓遺憾填滿歲月。",
"心無雜念，方能凝神聚力，奔赴遠方。",
"死亡是歸途，是與天地共生。",
"平凡的堅守，成就不凡的人生。",
"歲月磨人，卻也讓人成長。",
"心若平靜，風平浪靜；心若浮躁，世事紛擾。",
"每一次跌倒，都是為了更高飛翔。",
"人生如書，每頁都有不同的風景。",
"萬物皆有靈性，用心感受便知美好。",
"時光溫柔，善待每一個善良的人。",
"放下過往的傷痛，輕裝奔赴未來。",
"真正的自由，是靈魂的灑脫與自在。",
"花開花落，四季輪回，皆是常態。",
"人生如棋，知己知彼，方能百戰不殆。",
"心有清歡，歲月靜好，此生足矣。",
"時光不語，卻在默默沉澱。",
"生命的意義，在於體驗與感悟。",
"愛如星光，照亮前路，溫暖歲月。",
"風過流年，歲月沉香。",
"人生的美好，在於不期而遇的驚喜。",
"時光流逝，唯愛與美好不可辜負。",
"心有暖陽，何懼歲月寒涼。",
"死亡是另一種永恆，活在愛與記憶裡。",
"以平常心待世事，以歡喜心過生活。",
"歲月漫長，別忘初心，別丟自己。",
"心若自在，萬事皆自在。",
"每一次堅持，都藏著未來的驚喜。",
"人生如酒，歷經滄桑，方顯醇厚。",
"萬物皆有因果，種善因，得善果。",
"時光匆匆，願我們都能溫柔以待。",
"放下執念，擁抱屬於自己的幸福。",
"真正的幸福，是身邊有牽掛的人。",
"雲卷雲舒，自在從容，便是人生。",
"人生如戲，認真演好自己的角色。",
"心有山海，靜賞繁華。",
"時光清淺，歲月安然，不負遇見。",
"生命如光，驅散黑暗，帶來希望。",
"愛如春雨，潤物無聲，滋養心靈。",
"風裡的故事，藏著歲月的溫柔。",
"人生沒有白走的彎路，每一步都有收穫。",
"時光會篩選出最真摯的感情。",
"心無雜念，方能感受生命的美好。",
"死亡是回歸，與自然融為一體。",
"平凡的日子，也能活出詩意與浪漫。",
"歲月不居，初心不改，砥礪前行。",
"心若向陽，無畏艱難險阻。",
"每一次告別，都是為了重逢的驚喜。",
"人生如書，書寫屬於自己的傳奇。",
"萬物共生，和諧共處，便是圓滿。",
"時光溫柔，歲月可期。",
"放下過去，把握當下，創造未來。",
"真正的智慧，是懂得順其自然。",
"花開花謝，皆是生命的輪回。",
"人生如路，一路向前，無問西東。",
"心有清歡，不染世俗塵埃。",
"時光不語，靜待花開，不負期待。",
"生命的力量，在於生生不息的希望。",
"愛與被愛，是生命永恆的主題。",
"風過林梢，歲月如歌。",
"人生的智慧，在於懂得取捨與放下。",
"時光流逝，唯回憶與愛永存。",
"心有暖陽，歲月情深。",
"死亡不是終點，是另一種旅程的開始。",
"以溫柔之心，對待世間萬物。",
"歲月沉香，那些感動都值得銘記。",
"心若平靜，世事皆安。",
"每一次努力，都不會被時光辜負。",
"人生如茶，苦盡甘來，自有回甘。",
"萬物皆有裂痕，陽光方能普照。",
"時光匆匆，願我們都能不負韶華，不負自己。",
"放下遺憾，與自己和解，與歲月溫柔相處。",
"真正的強大，是能溫柔地面對所有傷痛。",
"月滿則虧，水滿則溢，人生貴在知足。",
"人生如戲，悲歡離合，皆是常態。",
"心有山海，不負熱愛。",
"時光清淺，安然向暖，靜待花開。",
"生命如草，野火燒不盡，春風吹又生。",
"愛如燈塔，照亮迷途，指引方向。",
"風遇溫柔，便有了停留的理由。",
"人生沒有標準答案，隨心而活便是最好。",
"時光會治癒所有遺憾，沉澱所有美好。",
"心無掛礙，方能自在飛翔。",
"死亡是自然的規律，不必畏懼，坦然接受。",
"平凡的日子，藏著最踏實的幸福。",
"歲月不饒人，我亦以溫柔待歲月。",
"心若向陽，風雨兼程也無畏。",
"每一次相遇，都值得用心珍惜。",
"人生如路，一路風景，一路感悟。",
"萬物生長，順應自然，便是最好。",
"時光見證成長，也沉澱溫柔。",
"放下執念，方能遇見更多美好。",
"真正的幸福，是內心的平和與安寧。",
"花開花落，一歲一枯榮，皆是生命。",
"人生如棋，落子從容，勝負隨緣。",
"心有清歡，歲月無恙。",
"時光溫柔，歲月靜好，一生安康。",
"生命的意義，在於為世界留下溫柔。",
"愛如清風，吹散陰霾，帶來晴朗。",
"風過流年，初心未改，熱愛依舊。",
"人生的美好，在於奮鬥與堅守。",
"時光流逝，唯善良與真誠不可丟。",
"心有暖陽，不懼歲月漫長。",
"死亡是另一種永恆，活在彼此的記憶裡。",
"以善意待世界，世界必以溫柔回饋。",
"歲月沉香，那些時光，溫暖了歲月。",
"心若自在，處處皆是風景。",
"每一次堅持，都在書寫不一樣的人生。",
"人生如酒，越品越有滋味。",
"萬物皆有靈性，懂得感恩，方能長久。",
"時光匆匆，別讓忙碌錯過溫柔。",
"放下過往，輕裝前行，未來可期。",
"真正的自由，是思想的無拘無束。",
"雲卷雲舒，花開花落，隨遇而安。",
"人生如戲，起落皆是常態，坦然面對。",
"心有山海，靜而致遠。",
"時光清淺，歲月安然，一生相伴。",
"生命如光，雖微弱，卻能照亮一方。",
"愛如雨露，滋養心靈，溫暖一生。",
"風裡藏著溫柔，雨裡帶著期盼。",
"人生沒有白吃的苦，終會化為甜。",
"時光會記住所有努力的痕跡。",
"心無雜念，方能凝神靜氣，成就自我。",
"死亡是回歸塵土，滋養新生，生生不息。",
"平凡的日子，也能活出精彩與價值。",
"歲月磨平棱角，卻留下溫柔與智慧。",
"心若向陽，自帶光芒。",
"每一次告別，都是成長的契機。",
"人生如書，翻開是精彩，合上是圓滿。",
"萬物共生，相互陪伴，便是溫暖。",
"時光溫柔，善待每一個追光的人。",
"放下執念，與歲月和解，與自己溫柔相處。",
"真正的幸福，是簡單的陪伴與懂得。",
"花開花謝，四季更迭，皆是風景。",
"人生如路，一路向前，不負時光。",
"心有清歡，歲月安然，此生無憾。",
"時光不語，卻見證所有真誠與熱愛。",
"生命的意義，在於體驗世間的美好與溫暖。",
"愛如星辰，照亮黑夜，溫暖心房。",
"風過林梢，時光正好。",
"人生的智慧，在於懂得進退有度。",
"時光流逝，唯初心與熱愛不可辜負。",
"心有暖陽，歲月情深，不負遇見。",
"死亡是另一種開始，不必悲傷，坦然送別。",
"以平常心看待得失，以歡喜心擁抱生活。",
"歲月漫長，願我們都能向陽生長。",
"心若平靜，萬事皆順。",
"每一次努力，都在靠近心中的夢想。",
"人生如茶，歷經沉澱，方顯清香。",
"萬物皆有因果，不忘初心，方得始終。",
"時光匆匆，願我們都能珍惜當下，不負餘生。",
"放下過往的遺憾，擁抱未來的希望。",
"真正的強大，是內心的篤定與從容。",
"雲聚雲散，緣來緣去，隨緣就好。",
"人生如戲，認真對待，便是精彩。",
"心有山海，靜賞歲月繁華。",
"時光清淺，歲月安然，溫暖相伴。",
"生命如河，奔湧向前，生生不息。",
"愛與時光，是生命最美的饋贈。"
];

export default function MonologuePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({ birthDate: '' });
  const [insight, setInsight] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [dailyQuote, setDailyQuote] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [isInsightSubmitted, setIsInsightSubmitted] = useState(false);
  const [lifeMetrics, setLifeMetrics] = useState({ daysLived: 0, yearProgress: 0, daysLeftInYear: 0 });

  useEffect(() => {
    loadData();
    
    // 設置今日隨機語錄 (基於日期的種子，確保每日更新且全天一致)
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    // 使用年份 + 一年中的第幾天作為種子，確保每年每天都不一樣
    const seed = today.getFullYear() * 1000 + dayOfYear;
    setDailyQuote(PRESET_INSIGHTS[seed % PRESET_INSIGHTS.length]);

    // 計算年度進度
    const totalDaysInYear = (today.getFullYear() % 4 === 0 && (today.getFullYear() % 100 !== 0 || today.getFullYear() % 400 === 0)) ? 366 : 365;
    const yearProgress = (dayOfYear / totalDaysInYear) * 100;
    const daysLeftInYear = totalDaysInYear - dayOfYear;
    setLifeMetrics(prev => ({ ...prev, yearProgress, daysLeftInYear }));
  }, []);

  useEffect(() => {
    if (profile.birthDate) {
      const birth = new Date(profile.birthDate);
      const today = new Date();
      if (!isNaN(birth.getTime())) {
        const diffTime = Math.abs(today.getTime() - birth.getTime());
        const daysLived = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setLifeMetrics(prev => ({ ...prev, daysLived }));
      }
    }
  }, [profile.birthDate]);

  const loadData = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem(PROFILE_KEY);
      if (storedProfile) setProfile(JSON.parse(storedProfile));

      const today = new Date().toISOString().split('T')[0];
      
      // 檢查今日是否已揭密
      const lastRevealDate = await AsyncStorage.getItem(REVEAL_KEY);
      if (lastRevealDate === today) {
        setIsRevealed(true);
      }

      const storedInsights = await AsyncStorage.getItem(INSIGHTS_KEY);
      if (storedInsights) {
        const insights: DailyInsight[] = JSON.parse(storedInsights);
        const todayInsight = insights.find(i => i.date === today);
        if (todayInsight) {
          setInsight(todayInsight.content);
          setIsInsightSubmitted(true);
        }
      }
    } catch (e) {
      console.error('Failed to load profile data');
    }
  };

  const handleReveal = async () => {
    if (isRevealed) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(REVEAL_KEY, today);
      setIsRevealed(true);
    } catch (e) {
      console.error('Failed to save reveal status');
      setIsRevealed(true); // 即便保存失敗也讓用戶看到，但下次進入會重置
    }
  };

  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      setIsEditingProfile(false);
    } catch (e) {
      Alert.alert('封存失敗');
    }
  };

  const saveDailyInsight = async () => {
    if (!insight.trim()) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedInsights = await AsyncStorage.getItem(INSIGHTS_KEY);
      let insights: DailyInsight[] = storedInsights ? JSON.parse(storedInsights) : [];
      
      const index = insights.findIndex(i => i.date === today);
      if (index > -1) {
        insights[index].content = insight;
      } else {
        insights.push({ date: today, content: insight });
      }

      await AsyncStorage.setItem(INSIGHTS_KEY, JSON.stringify(insights));
      setIsInsightSubmitted(true);
      Alert.alert('封存成功', '今日的感悟已入冊。');
    } catch (e) {
      Alert.alert('封存失敗');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ 
        title: '獨 白',
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
        animation: 'fade',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
            <Ionicons name="chevron-back" size={24} color="#121212" />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Daily Insight Section */}
        <RNView style={styles.section}>
          <RNView style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>DAILY INSIGHT</Text>
            <TouchableOpacity onPress={() => router.push('/monologue/history')}>
              <Text style={styles.historyButtonText}>HISTORY</Text>
            </TouchableOpacity>
          </RNView>
          
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={handleReveal}
            onLongPress={handleReveal}
          >
            <RNView style={[styles.quoteCard, !isRevealed && styles.quoteCardSealed]}>
              {isRevealed ? (
                <Text style={styles.quoteText}>"{dailyQuote}"</Text>
              ) : (
                <RNView style={styles.sealedContainer}>
                  <Ionicons name="eye-off-outline" size={24} color="#D0D0CA" />
                  <Text style={styles.sealedText}>點擊以揭示今日的命運</Text>
                </RNView>
              )}
            </RNView>
          </TouchableOpacity>

          {isInsightSubmitted ? (
            <RNView style={styles.submittedInsightContainer}>
              <Text style={styles.submittedInsightText}>{insight}</Text>
              <RNView style={styles.submittedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#8A8A82" />
                <Text style={styles.submittedBadgeText}>今日已封存</Text>
              </RNView>
            </RNView>
          ) : (
            <>
              <TextInput
                style={styles.insightInput}
                placeholder="此刻的想法..."
                value={insight}
                onChangeText={setInsight}
                multiline
                placeholderTextColor="#CCC"
              />
              <TouchableOpacity style={styles.saveButton} onPress={saveDailyInsight}>
                <Text style={styles.saveButtonText}>封存今日</Text>
              </TouchableOpacity>
            </>
          )}
        </RNView>

        {/* Profile Section */}
        <RNView style={styles.section}>
          <RNView style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>ABOUT ME</Text>
            <TouchableOpacity onPress={() => isEditingProfile ? saveProfile() : setIsEditingProfile(true)}>
              <Text style={styles.editButtonText}>{isEditingProfile ? '封存' : '修改'}</Text>
            </TouchableOpacity>
          </RNView>

          <RNView style={styles.profileContent}>
            <RNView style={styles.profileItem}>
              <Text style={styles.profileLabel}>降生</Text>
              {isEditingProfile ? (
                <TextInput
                  style={styles.profileInput}
                  value={profile.birthDate}
                  onChangeText={text => setProfile({ ...profile, birthDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#EEE"
                />
              ) : (
                <Text style={styles.profileValue}>{profile.birthDate || '未設置'}</Text>
              )}
            </RNView>
          </RNView>
        </RNView>

        {/* Life Metrics Section */}
        <RNView style={styles.section}>
          <RNView style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>LIFE METRICS</Text>
          </RNView>
          
          <RNView style={styles.metricsGrid}>
            <RNView style={styles.metricItem}>
              <Text style={styles.metricLabel}>已渡過</Text>
              <Text style={styles.metricValue}>{lifeMetrics.daysLived || '—'}</Text>
              <Text style={styles.metricUnit}>DAYS</Text>
            </RNView>
            
            <RNView style={styles.metricItem}>
              <Text style={styles.metricLabel}>今年剩餘</Text>
              <Text style={styles.metricValue}>{lifeMetrics.daysLeftInYear}</Text>
              <Text style={styles.metricUnit}>DAYS</Text>
            </RNView>
          </RNView>

          <RNView style={styles.progressContainer}>
            <RNView style={styles.progressHeader}>
              <Text style={styles.progressLabel}>年度進度</Text>
              <Text style={styles.progressPercent}>{Math.round(lifeMetrics.yearProgress)}%</Text>
            </RNView>
            <RNView style={styles.progressBarBg}>
              <RNView style={[styles.progressBarFill, { width: `${lifeMetrics.yearProgress}%` }]} />
            </RNView>
          </RNView>
        </RNView>

        <RNView style={styles.footer}>
          <Text style={styles.footerText}>在時間的流逝中，留下一點痕跡。</Text>
        </RNView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  content: {
    padding: 30,
  },
  section: {
    marginBottom: 50,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 2,
    color: '#999',
    fontWeight: 'bold',
  },
  quoteCard: {
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    marginBottom: 20,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#121212',
    lineHeight: 28,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  quoteCardSealed: {
    backgroundColor: '#E8E8E0',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D0D0CA',
  },
  sealedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  sealedText: {
    fontSize: 10,
    color: '#999990',
    marginTop: 10,
    letterSpacing: 2,
  },
  insightInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingVertical: 15,
    fontSize: 16,
    color: '#000',
    minHeight: 60,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#000',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 5,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  submittedInsightContainer: {
    paddingVertical: 15,
    borderLeftWidth: 1,
    borderLeftColor: '#8A8A82',
    paddingLeft: 15,
    backgroundColor: '#F9F9F9',
    marginTop: 10,
  },
  submittedInsightText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  submittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 5,
  },
  submittedBadgeText: {
    fontSize: 10,
    color: '#8A8A82',
    letterSpacing: 1,
  },
  profileContent: {
    gap: 30,
  },
  profileItem: {
    borderLeftWidth: 1,
    borderLeftColor: '#D0D0CA',
    paddingLeft: 15,
  },
  profileLabel: {
    fontSize: 10,
    color: '#999990',
    marginBottom: 5,
    letterSpacing: 2,
  },
  profileValue: {
    fontSize: 16,
    color: '#121212',
    fontWeight: '300',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  profileInput: {
    fontSize: 18,
    color: '#000',
    paddingVertical: 5,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    textDecorationLine: 'underline',
  },
  historyButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#999',
    textDecorationLine: 'underline',
    letterSpacing: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#999990',
    marginBottom: 10,
    letterSpacing: 2,
  },
  metricValue: {
    fontSize: 28,
    color: '#121212',
    fontWeight: '200',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  metricUnit: {
    fontSize: 8,
    color: '#D0D0CA',
    marginTop: 5,
    letterSpacing: 1,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 10,
    color: '#999990',
    letterSpacing: 2,
  },
  progressPercent: {
    fontSize: 12,
    color: '#121212',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  progressBarBg: {
    height: 2,
    backgroundColor: '#E8E8E0',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#121212',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#EEE',
    fontStyle: 'italic',
  },
});
