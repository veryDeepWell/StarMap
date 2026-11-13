(() => {
  'use strict';

  const city = window.STARMAP;
  const cityGuide = 'https://www.hoyolab.com/article/44756242';
  const parkGuide = 'https://game8.co/games/Honkai-Star-Rail/archives/448208';
  const pigeonGuide = 'https://game8.co/games/Honkai-Star-Rail/archives/591062';

  const groups = [
    ...city.groups.filter(group => group.id !== 'event'),
    {id: 'puzzle', name: 'Головоломки', symbol: '◇', color: '#bcafff'},
    {id: 'platformer', name: 'Платформеры', symbol: '▤', color: '#9dd4ff'},
    {id: 'room', name: 'Комнаты', symbol: '▣', color: '#baa0fa'},
    {id: 'collectible', name: 'Коллекционные предметы', symbol: '✦', color: '#ffaab7'},
    {id: 'trotter', name: 'Свинка-копилка', symbol: '●', color: '#fec893'},
    {id: 'achievement', name: 'Достижения', symbol: '★', color: '#fbe397'},
  ];

  const supplements = [
      {
        id: 212,
        secondarySource: 'https://star-rail-map.appsample.com/?map=clock_studios_theme_park',
        points: [
          {
            id: 'hanu-f2', group: 'room', name: 'Приключение Хану у съёмочной площадки', number: 1, container: true, floor: '216',
            guide: {
              url: parkGuide,
              label: 'Game8 · сундуки №24–26',
              steps: ['Найди телевизор Хану рядом со съёмочной площадкой на 2-м этаже.', 'Включи телевизор и в облике Хану пролезь через пролом в декорациях.', 'Подбери ракетницу. Отсюда можно отправиться за тремя отдельными сундуками.'],
            },
          },
          {
            id: 'chest-24', group: 'treasure', name: 'Сундук за стеной с фейерверками', number: 24, parent: 'hanu-f2', reference: true,
            guide: {
              url: parkGuide,
              label: 'Game8 · сундук №24',
              steps: ['Забери ракетницу в комнате Хану.', 'Вернись к месту, где патруль проходит возле фейерверков.', 'Дождись, пока патруль подойдёт к фейерверкам, и выстрели в них.', 'Пройди через разрушенную стену и открой сундук.'],
            },
          },
          {
            id: 'chest-25', group: 'treasure', name: 'Сундук за декорациями', number: 25, parent: 'hanu-f2', reference: true,
            guide: {
              url: parkGuide,
              label: 'Game8 · сундук №25',
              steps: ['Оставайся в облике Хану.', 'У телевизора найди щель под большими вывесками и пролезь под ними.', 'Открой сундук в конце прохода.'],
            },
          },
          {
            id: 'chest-26', group: 'treasure', name: 'Сундук на полке', number: 26, parent: 'hanu-f2', reference: true,
            guide: {
              url: parkGuide,
              label: 'Game8 · сундук №26',
              steps: ['Вернись к месту, где подобрал ракетницу.', 'Подожди, пока патруль подойдёт к ближайшим фейерверкам, и выстрели в них.', 'Воспользуйся открывшейся точкой телепортации, чтобы попасть на полку. Открой сундук.'],
            },
          },
          {
            id: 2022, group: 'trotter', name: 'Свинка-копилка в лабиринте', number: 1, floor: '215', jade: 60,
            rewardSource: 'https://www.hoyolab.com/article/18284807',
            guide: {
              url: parkGuide,
              label: 'Game8 · местоположение копилки',
              requirement: 'Заверши все задания сюжетной главы «Кошка среди голубей».',
              steps: ['На первом этаже войди в лабиринт и доберись до центральной площадки.', 'Найди копилку возле места, где лежит сундук №5 по нумерации Game8.', 'Вступи в бой и победи копилку до того, как она сбежит.'],
            },
          },
        ],
      },
      {
        id: 681,
        secondarySource: 'https://star-rail-map.appsample.com/?map=pearluxe_tower',
        points: [
          {id: 'pearl-studio-jump-ii', group: 'platformer', name: 'Двухмерный прыжок · сложность II', number: 1, container: true, floor: '682'},
          {
            id: 'skinners-pigeon', group: 'achievement', name: 'Skinner’s Pigeon', number: 1, parent: 'pearl-studio-jump-ii', jade: 5,
            rewardSource: pigeonGuide,
            guide: {
              url: pigeonGuide,
              label: 'Game8 · Skinner’s Pigeon',
              steps: ['В студии Перл войди в «Двухмерный прыжок» на сложности II.', 'В финальной секции найди кнопку, вокруг которой лежат золотые монеты.', 'Прыгни с пружины так, чтобы ударить по кнопке.', 'Активируй одну и ту же кнопку 10 раз подряд. Забери награду в списке достижений.'],
            },
          },
        ],
      },
  ];

  const cityRegion = window.STARMAP_WORLD.find(region => region.id === 842);
  cityRegion.secondarySource = 'https://star-rail-map.appsample.com/?map=starfall_tower';
  for (const point of cityRegion.points) {
    if ([686, 842].includes(point.label)) point.guide = {url: cityGuide, label: 'Видео прохождения на HoYoLAB'};
  }
  for (const supplement of supplements) {
    const region = window.STARMAP_WORLD.find(region => region.id === supplement.id);
    region.secondarySource = supplement.secondarySource;
    for (const point of supplement.points) {
      const existing = region.points.find(item => item.id === point.id);
      if (existing) Object.assign(existing, {guide: point.guide, name: point.name});
      else region.points.push(point);
    }
  }

  window.STARMAP_CATALOG = {groups, regions: window.STARMAP_WORLD};
})();
