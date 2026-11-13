(() => {
  'use strict';

  const video = 'https://www.youtube.com/watch?v=336CMN7hcX4';
  const early = 'https://dotesports.com/honkai/guides/all-16-golden-scapegoat-puzzle-locations-and-solutions-in-honkai-star-rail';
  const kremnos = 'https://wotpack.ru/zolotoe-runo-otpuscheniya-v-honkai-star-rail-kak-reshit-vse-zagadki-s-golovoy-kozla/';
  const ruins = 'https://gamesfuze.com/guides/honkai-star-rail-all-strife-ruins-golden-scapegoat-puzzles/';
  const sanctuary = 'https://genshindrop.io/community/hsr-guides/sanctum-of-prophecy-janusopolis-guide';
  const finale = 'https://allthings.how/honkai-star-rail-3-7-golden-scapegoat-locations-and-solutions/';

  const videoByRegion = new Map([
    [330, 0], [333, 162], [344, 294], [349, 470], [376, 728],
    [377, 912], [413, 1120], [415, 1267], [432, 1483], [427, 1535],
    [430, 1701], [433, 1890], [447, 2076], [449, 2162], [462, 2428],
    [463, 2657], [478, 2902], [479, 3076],
    [443, 1890], [453, 2162], [472, 2657],
  ]);

  // Match by HoYoLAB marker ID, using the floor and nearby landmarks.
  const solutions = new Map([
    [2954, {url: early, time: 0, landmark: 'Западная сторона Мраморной ярмарки.', moves: 'RRLRLURR'}],
    [2955, {url: kremnos, time: 42, landmark: 'Клумбы к юго-востоку от Мраморного дворца.', steps: ['Иди вправо до алтаря.']}],
    [2956, {url: early, time: 84, landmark: 'Рядом с комнатой Первопроходца в Зале отдыха.', moves: 'RRRRLR'}],
    [2957, {url: early, time: 122, landmark: 'За ширмами у круглой купальни, возле Двора трёх сезонов.', moves: 'RLRRRRLR', steps: ['Продолжай вправо до алтаря.']}],
    [3037, {url: kremnos, time: 162, landmark: 'Под южным мостом, на этаже −1. Освободи проход каменным шаром.', moves: 'RRDRRRULLLLLL'}],
    [2993, {url: kremnos, time: 205, landmark: 'Верх лестницы на западной стороне Зала раздора. Разбей ящики каменным шаром.', moves: 'LRRDRRLULLLD'}],
    [2992, {url: early, time: 252, landmark: 'В северной части второго этажа, за восстанавливаемым мостом.', moves: 'RDRURRLLLLLL', steps: ['Продолжай вправо до алтаря.']}],
    [3126, {url: kremnos, landmark: 'Юго-запад этажа −1, у Прохода изгнания души. По дороге восстанови мост.', moves: 'RRRRLLLU', steps: ['Иди вправо до алтаря.']}],
    [3062, {url: early, time: 331, landmark: 'В западном коридоре второго этажа возле Земель завоевания.', moves: 'RDRRRLLURRR'}],
    [3043, {url: ruins, time: 366, landmark: 'Третий этаж, лестница в восточной части второго этажа.', moves: 'RLRR', steps: ['Двигайся влево и вправо, пока тень не упадёт на жёлтую кнопку. Затем иди к алтарю.']}],
    [3134, {url: ruins, landmark: 'Этаж −1, в глубине Руин ковки душ.', moves: 'RURURURRRLUDUDUDRL', steps: ['Когда тень встанет на кнопку, иди влево до алтаря.']}],
    [3197, {url: early, time: 470, landmark: 'Нижняя средняя комната Янусополиса. Переведи её в состояние Рассвета.', moves: 'RRRRRLLLLURRR'}],
    [3142, {url: early, time: 526, landmark: 'Южный край карты, возле Гробницы прерванного сна.', moves: 'RRRLLLLRRRL'}],
    [3155, {url: early, time: 563, landmark: 'От Врат вечного сна спустись по западной лестнице.', moves: 'RRRRRRLRLRLULLDLRURRRRUR'}],
    [3223, {url: early, time: 627, landmark: 'Верхняя средняя комната в состоянии Рассвета. Восстанови западный мост.', moves: 'RLLRLRLRLL'}],
    [3224, {url: early, time: 680, landmark: 'Верхняя средняя комната в состоянии Рассвета. Убери ящики сферой чудес и обойди дверь.', moves: 'RRRRRRRRLLLLLLL'}],
    [4416, {url: finale, time: 2902, landmark: 'Рядом с пространственным якорем.', moves: 'LLLLLRURRRR'}],
    [4419, {url: finale, landmark: 'Юго-западный остров. Используй тайную тропу к соседней площадке.', moves: 'RRRLLULLRLURRRRRR'}],
    [4429, {url: finale, landmark: 'Центральный остров.', moves: 'LLDRRRDRRRRRDRR'}],
    [4427, {url: finale, landmark: 'Северо-западный остров.', moves: 'LLLLLURRRRRRR'}],
    [4466, {url: finale, landmark: 'К северу от Дворика в руинах, внутри здания за преградой.', moves: 'LLLLURRRLRRRRR'}],
    [4491, {url: finale, landmark: 'На балконе за Швеёй, возле Темницы желаний.', moves: 'LLLDRLRRUDLLRRUDLLUL'}],
    [4474, {url: finale, landmark: 'Используй Бартолоса у куба, затем поднимись на цветочном лифте.', moves: 'RRRRLRLRLLRLRRR'}],
  ]);

  const regionSources = new Map([
    [376, sanctuary],
    [377, 'https://www.hoyolab.com/article/37364872'],
    [413, 'https://www.hoyolab.com/article/38205653'],
    [415, 'https://www.hoyolab.com/article/38205653'],
    [432, 'https://www.hoyolab.com/article/39103179'],
    [433, 'https://wotpack.ru/zolotoe-runo-otpuscheniya-v-paryaschey-kreposti-tsirkadnogo-oka-v-hsr-kak-reshit-golovolomki/'],
    [479, 'https://wotpack.ru/zolotoe-runo-otpuscheniya-v-ruinah-vremeni-berega-pogrebennyh-vospominaniy-v-hsr-kak-proyti/'],
  ]);

  function videoAt(time) {
    return video + '&t=' + time + 's';
  }

  function getGuide(point, region) {
    const solution = solutions.get(point.id);
    if (solution) {
      const {time, ...guide} = solution;
      return {...guide, label: 'Источник решения ↗', video: time == null ? undefined : videoAt(time)};
    }
    const source = regionSources.get(region.id);
    const walkthrough = videoAt(videoByRegion.get(region.id) ?? 0);
    return {
      url: source || walkthrough,
      label: source ? 'Решения для локации ↗' : 'Видео решений по локации ↗',
      video: source ? walkthrough : undefined,
      videoLabel: 'Видео для локации ↗',
      coverage: 'region',
    };
  }

  window.STARMAP_RUNE_GUIDES = {getGuide};
})();
