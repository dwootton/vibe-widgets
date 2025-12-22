const TICTACTOE_URL = '/examples/interactive_tic_tac_toe_game_board_follo__ef3388891e__v1.js';
const SCATTER_URL = '/examples/temperature_across_days_seattle_colored__1e5a77bc87__v1.js';
const BARS_URL = '/examples/horizontal_bar_chart_weather_conditions__b7796577c1__v2.js';

export const EXAMPLES = [
  {
    id: 'tic-tac-toe',
    label: 'Interactive Tic-Tac-Toe Game',
    prompt: "Click cells to play; exports 'ai_move' for AI responses",
    moduleUrl: TICTACTOE_URL,
  },
  {
    id: 'weather-scatter',
    label: 'Scatter: Temperature vs Humidity',
    prompt: "Brush-select points; exports 'selected_indices'",
    moduleUrl: SCATTER_URL,
  },
  {
    id: 'weather-bars',
    label: 'Bars: Weather Conditions (Linked)',
    prompt: "Reads 'selected_indices' to filter counts",
    moduleUrl: BARS_URL,
  },
];