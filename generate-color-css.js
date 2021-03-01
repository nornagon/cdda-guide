// jerry rigged from various cdda sources

black = 0x00;    // RGB{0; 0; 0}
red = 0x01;      // RGB{196; 0; 0}
green = 0x02;    // RGB{0; 196; 0}
yellow = 0x03;   // RGB{196; 180; 30}
blue = 0x04;     // RGB{0; 0; 196}
magenta = 0x05;  // RGB{196; 0; 180}
cyan = 0x06;     // RGB{0; 170; 200}
white = 0x07;    // RGB{196; 196; 196}
color_pairs = {}
const init_pair = (num, fg, bg) => {
  color_pairs[num] = [fg, bg]
}
    init_pair( 1, white,      black );
    init_pair( 2, red,        black );
    init_pair( 3, green,      black );
    init_pair( 4, blue,       black );
    init_pair( 5, cyan,       black );
    init_pair( 6, magenta,    black );
    init_pair( 7, yellow,     black );

    // Inverted Colors
    init_pair( 8, black,      white );
    init_pair( 9, black,      red );
    init_pair( 10, black,      green );
    init_pair( 11, black,      blue );
    init_pair( 12, black,      cyan );
    init_pair( 13, black,      magenta );
    init_pair( 14, black,      yellow );

    // Highlighted - blue background
    init_pair( 15, white,      blue );
    init_pair( 16, red,        blue );
    init_pair( 17, green,      blue );
    init_pair( 18, blue,       blue );
    init_pair( 19, cyan,       blue );
    init_pair( 20, black,      blue );
    init_pair( 21, magenta,    blue );
    init_pair( 22, yellow,     blue );

    // Red background - for monsters on fire
    init_pair( 23, white,      red );
    init_pair( 24, red,        red );
    init_pair( 25, green,      red );
    init_pair( 26, blue,       red );
    init_pair( 27, cyan,       red );
    init_pair( 28, magenta,    red );
    init_pair( 29, yellow,     red );

    init_pair( 30, black,      black );
    init_pair( 31, white,      black );

    init_pair( 32, black,      white );
    init_pair( 33, white,      white );
    init_pair( 34, red,        white );
    init_pair( 35, green,      white );
    init_pair( 36, yellow,     white );
    init_pair( 37, blue,       white );
    init_pair( 38, magenta,    white );
    init_pair( 39, cyan,       white );

    init_pair( 40, black,      green );
    init_pair( 41, white,      green );
    init_pair( 42, red,        green );
    init_pair( 43, green,      green );
    init_pair( 44, yellow,     green );
    init_pair( 45, blue,       green );
    init_pair( 46, magenta,    green );
    init_pair( 47, cyan,       green );

    init_pair( 48, black,      yellow );
    init_pair( 49, white,      yellow );
    init_pair( 50, red,        yellow );
    init_pair( 51, green,      yellow );
    init_pair( 52, yellow,     yellow );
    init_pair( 53, blue,       yellow );
    init_pair( 54, magenta,    yellow );
    init_pair( 55, cyan,       yellow );

    init_pair( 56, black,      magenta );
    init_pair( 57, white,      magenta );
    init_pair( 58, red,        magenta );
    init_pair( 59, green,      magenta );
    init_pair( 60, yellow,     magenta );
    init_pair( 61, blue,       magenta );
    init_pair( 62, magenta,    magenta );
    init_pair( 63, cyan,       magenta );

    init_pair( 64, black,      cyan );
    init_pair( 65, white,      cyan );
    init_pair( 66, red,        cyan );
    init_pair( 67, green,      cyan );
    init_pair( 68, yellow,     cyan );
    init_pair( 69, blue,       cyan );
    init_pair( 70, magenta,    cyan );
    init_pair( 71, cyan,       cyan );

function color_pair(i) {
  return {
    fg: color_pairs[i][0],
    bg: color_pairs[i][1],
    bold() { return {...this, is_bold: true} },
    blink() { return {...this, is_blink: true} },
    is_bold: false,
    is_blink: false,
    color() {

      let fg = this.fg;
      let bg = this.bg;
      if (this.is_bold)
        fg = fg + 8;
      if (this.is_blink)
        bg = bg + 8;
      return { fg, bg }
    }
  }
}

all_colors = {}
function add_color(def, name, pair, inverse) {
  all_colors[name] = {
    ...pair.color(),
    inverse
  }
}

    add_color( "def_c_black", "c_black", color_pair( 30 ), "def_i_black" );
    add_color( "def_c_white", "c_white", color_pair( 1 ).bold(), "def_i_white" );
    add_color( "def_c_light_gray", "c_light_gray", color_pair( 1 ), "def_i_light_gray" );
    add_color( "def_c_dark_gray", "c_dark_gray", color_pair( 30 ).bold(), "def_i_dark_gray" );
    add_color( "def_c_red", "c_red", color_pair( 2 ), "def_i_red" );
    add_color( "def_c_green", "c_green", color_pair( 3 ), "def_i_green" );
    add_color( "def_c_blue", "c_blue", color_pair( 4 ), "def_i_blue" );
    add_color( "def_c_cyan", "c_cyan", color_pair( 5 ), "def_i_cyan" );
    add_color( "def_c_magenta", "c_magenta", color_pair( 6 ), "def_i_magenta" );
    add_color( "def_c_brown", "c_brown", color_pair( 7 ), "def_i_brown" );
    add_color( "def_c_light_red", "c_light_red", color_pair( 2 ).bold(), "def_i_light_red" );
    add_color( "def_c_light_green", "c_light_green", color_pair( 3 ).bold(), "def_i_light_green" );
    add_color( "def_c_light_blue", "c_light_blue", color_pair( 4 ).bold(), "def_i_light_blue" );
    add_color( "def_c_light_cyan", "c_light_cyan", color_pair( 5 ).bold(), "def_i_light_cyan" );
    add_color( "def_c_pink", "c_pink", color_pair( 6 ).bold(), "def_i_pink" );
    add_color( "def_c_yellow", "c_yellow", color_pair( 7 ).bold(), "def_i_yellow" );

    add_color( "def_h_black", "h_black", color_pair( 20 ), "def_c_blue" );
    add_color( "def_h_white", "h_white", color_pair( 15 ).bold(), "def_c_light_blue_white" );
    add_color( "def_h_light_gray", "h_light_gray", color_pair( 15 ), "def_c_blue_white" );
    add_color( "def_h_dark_gray", "h_dark_gray", color_pair( 20 ).bold(), "def_c_light_blue" );
    add_color( "def_h_red", "h_red", color_pair( 16 ), "def_c_blue_red" );
    add_color( "def_h_green", "h_green", color_pair( 17 ), "def_c_blue_green" );
    add_color( "def_h_blue", "h_blue", color_pair( 20 ), "def_h_blue" );
    add_color( "def_h_cyan", "h_cyan", color_pair( 19 ), "def_c_blue_cyan" );
    add_color( "def_h_magenta", "h_magenta", color_pair( 21 ), "def_c_blue_magenta" );
    add_color( "def_h_brown", "h_brown", color_pair( 22 ), "def_c_blue_yellow" );
    add_color( "def_h_light_red", "h_light_red", color_pair( 16 ).bold(), "def_c_light_blue_red" );
    add_color( "def_h_light_green", "h_light_green", color_pair( 17 ).bold(), "def_c_light_blue_green" );
    add_color( "def_h_light_blue", "h_light_blue", color_pair( 18 ).bold(), "def_h_light_blue" );
    add_color( "def_h_light_cyan", "h_light_cyan", color_pair( 19 ).bold(), "def_c_light_blue_cyan" );
    add_color( "def_h_pink", "h_pink", color_pair( 21 ).bold(), "def_c_light_blue_magenta" );
    add_color( "def_h_yellow", "h_yellow", color_pair( 22 ).bold(), "def_c_light_blue_yellow" );

    add_color( "def_i_black", "i_black", color_pair( 32 ), "def_c_black" );
    add_color( "def_i_white", "i_white", color_pair( 8 ).blink(), "def_c_white" );
    add_color( "def_i_light_gray", "i_light_gray", color_pair( 8 ), "def_c_light_gray" );
    add_color( "def_i_dark_gray", "i_dark_gray", color_pair( 32 ).blink(), "def_c_dark_gray" );
    add_color( "def_i_red", "i_red", color_pair( 9 ), "def_c_red" );
    add_color( "def_i_green", "i_green", color_pair( 10 ), "def_c_green" );
    add_color( "def_i_blue", "i_blue", color_pair( 11 ), "def_c_blue" );
    add_color( "def_i_cyan", "i_cyan", color_pair( 12 ), "def_c_cyan" );
    add_color( "def_i_magenta", "i_magenta", color_pair( 13 ), "def_c_magenta" );
    add_color( "def_i_brown", "i_brown", color_pair( 14 ), "def_c_brown" );
    add_color( "def_i_light_red", "i_light_red", color_pair( 9 ).blink(), "def_c_light_red" );
    add_color( "def_i_light_green", "i_light_green", color_pair( 10 ).blink(), "def_c_light_green" );
    add_color( "def_i_light_blue", "i_light_blue", color_pair( 11 ).blink(), "def_c_light_blue" );
    add_color( "def_i_light_cyan", "i_light_cyan", color_pair( 12 ).blink(), "def_c_light_cyan" );
    add_color( "def_i_pink", "i_pink", color_pair( 13 ).blink(), "def_c_pink" );
    add_color( "def_i_yellow", "i_yellow", color_pair( 14 ).blink(), "def_c_yellow" );

    add_color( "def_c_black_red", "c_black_red", color_pair( 9 ).bold(), "def_c_red" );
    add_color( "def_c_white_red", "c_white_red", color_pair( 23 ).bold(), "def_c_red_white" );
    add_color( "def_c_light_gray_red", "c_light_gray_red", color_pair( 23 ), "def_c_light_red_white" );
    add_color( "def_c_dark_gray_red", "c_dark_gray_red", color_pair( 9 ), "def_c_dark_gray_red" );
    add_color( "def_c_red_red", "c_red_red", color_pair( 9 ), "def_c_red_red" );
    add_color( "def_c_green_red", "c_green_red", color_pair( 25 ), "def_c_red_green" );
    add_color( "def_c_blue_red", "c_blue_red", color_pair( 26 ), "def_h_red" );
    add_color( "def_c_cyan_red", "c_cyan_red", color_pair( 27 ), "def_c_red_cyan" );
    add_color( "def_c_magenta_red", "c_magenta_red", color_pair( 28 ), "def_c_red_magenta" );
    add_color( "def_c_brown_red", "c_brown_red", color_pair( 29 ), "def_c_red_yellow" );
    add_color( "def_c_light_red_red", "c_light_red_red", color_pair( 24 ).bold(), "def_c_red_red" );
    add_color( "def_c_light_green_red", "c_light_green_red", color_pair( 25 ).bold(),
               "def_c_light_red_green" );
    add_color( "def_c_light_blue_red", "c_light_blue_red", color_pair( 26 ).bold(), "def_h_light_red" );
    add_color( "def_c_light_cyan_red", "c_light_cyan_red", color_pair( 27 ).bold(),
               "def_c_light_red_cyan" );
    add_color( "def_c_pink_red", "c_pink_red", color_pair( 28 ).bold(), "def_c_light_red_magenta" );
    add_color( "def_c_yellow_red", "c_yellow_red", color_pair( 29 ).bold(), "def_c_red_yellow" );

    add_color( "def_c_unset", "c_unset", color_pair( 31 ), "def_c_unset" );

    add_color( "def_c_black_white", "c_black_white", color_pair( 32 ), "def_c_light_gray" );
    add_color( "def_c_dark_gray_white", "c_dark_gray_white", color_pair( 32 ).bold(), "def_c_white" );
    add_color( "def_c_light_gray_white", "c_light_gray_white", color_pair( 33 ), "def_c_light_gray_white" );
    add_color( "def_c_white_white", "c_white_white", color_pair( 33 ).bold(), "def_c_white_white" );
    add_color( "def_c_red_white", "c_red_white", color_pair( 34 ), "def_c_white_red" );
    add_color( "def_c_light_red_white", "c_light_red_white", color_pair( 34 ).bold(),
               "def_c_light_gray_red" );
    add_color( "def_c_green_white", "c_green_white", color_pair( 35 ), "def_c_light_gray_green" );
    add_color( "def_c_light_green_white", "c_light_green_white", color_pair( 35 ).bold(),
               "def_c_white_green" );
    add_color( "def_c_brown_white", "c_brown_white", color_pair( 36 ), "def_c_light_gray_yellow" );
    add_color( "def_c_yellow_white", "c_yellow_white", color_pair( 36 ).bold(), "def_c_white_yellow" );
    add_color( "def_c_blue_white", "c_blue_white", color_pair( 37 ), "def_h_light_gray" );
    add_color( "def_c_light_blue_white", "c_light_blue_white", color_pair( 37 ).bold(), "def_h_white" );
    add_color( "def_c_magenta_white", "c_magenta_white", color_pair( 38 ), "def_c_light_gray_magenta" );
    add_color( "def_c_pink_white", "c_pink_white", color_pair( 38 ).bold(), "def_c_white_magenta" );
    add_color( "def_c_cyan_white", "c_cyan_white", color_pair( 39 ), "def_c_light_gray_cyan" );
    add_color( "def_c_light_cyan_white", "c_light_cyan_white", color_pair( 39 ).bold(),
               "def_c_white_cyan" );

    add_color( "def_c_black_green", "c_black_green", color_pair( 40 ), "def_c_green" );
    add_color( "def_c_dark_gray_green", "c_dark_gray_green", color_pair( 40 ).bold(), "def_c_light_green" );
    add_color( "def_c_light_gray_green", "c_light_gray_green", color_pair( 41 ), "def_c_green_white" );
    add_color( "def_c_white_green", "c_white_green", color_pair( 41 ).bold(), "def_c_light_green_white" );
    add_color( "def_c_red_green", "c_red_green", color_pair( 42 ), "def_c_green_red" );
    add_color( "def_c_light_red_green", "c_light_red_green", color_pair( 42 ).bold(),
               "def_c_light_green_red" );
    add_color( "def_c_green_green", "c_green_green", color_pair( 43 ), "def_c_green_green" );
    add_color( "def_c_light_green_green", "c_light_green_green", color_pair( 43 ).bold(),
               "def_c_light_green_green" );
    add_color( "def_c_brown_green", "c_brown_green", color_pair( 44 ), "def_c_green_yellow" );
    add_color( "def_c_yellow_green", "c_yellow_green", color_pair( 44 ).bold(),
               "def_c_light_green_yellow" );
    add_color( "def_c_blue_green", "c_blue_green", color_pair( 45 ), "def_h_green" );
    add_color( "def_c_light_blue_green", "c_light_blue_green", color_pair( 45 ).bold(),
               "def_h_light_green" );
    add_color( "def_c_magenta_green", "c_magenta_green", color_pair( 46 ), "def_c_green_magenta" );
    add_color( "def_c_pink_green", "c_pink_green", color_pair( 46 ).bold(), "def_c_light_green_magenta" );
    add_color( "def_c_cyan_green", "c_cyan_green", color_pair( 47 ), "def_c_green_cyan" );
    add_color( "def_c_light_cyan_green", "c_light_cyan_green", color_pair( 47 ).bold(),
               "def_c_light_green_cyan" );

    add_color( "def_c_black_yellow", "c_black_yellow", color_pair( 48 ), "def_c_brown" );
    add_color( "def_c_dark_gray_yellow", "c_dark_gray_yellow", color_pair( 48 ).bold(), "def_c_yellow" );
    add_color( "def_c_light_gray_yellow", "c_light_gray_yellow", color_pair( 49 ), "def_c_brown_white" );
    add_color( "def_c_white_yellow", "c_white_yellow", color_pair( 49 ).bold(), "def_c_yellow_white" );
    add_color( "def_c_red_yellow", "c_red_yellow", color_pair( 50 ), "def_c_yellow_red" );
    add_color( "def_c_light_red_yellow", "c_light_red_yellow", color_pair( 50 ).bold(),
               "def_c_yellow_red" );
    add_color( "def_c_green_yellow", "c_green_yellow", color_pair( 51 ), "def_c_brown_green" );
    add_color( "def_c_light_green_yellow", "c_light_green_yellow", color_pair( 51 ).bold(),
               "def_c_yellow_green" );
    add_color( "def_c_brown_yellow", "c_brown_yellow", color_pair( 52 ), "def_c_brown_yellow" );
    add_color( "def_c_yellow_yellow", "c_yellow_yellow", color_pair( 52 ).bold(), "def_c_yellow_yellow" );
    add_color( "def_c_blue_yellow", "c_blue_yellow", color_pair( 53 ), "def_h_brown" );
    add_color( "def_c_light_blue_yellow", "c_light_blue_yellow", color_pair( 53 ).bold(), "def_h_yellow" );
    add_color( "def_c_magenta_yellow", "c_magenta_yellow", color_pair( 54 ), "def_c_brown_magenta" );
    add_color( "def_c_pink_yellow", "c_pink_yellow", color_pair( 54 ).bold(), "def_c_yellow_magenta" );
    add_color( "def_c_cyan_yellow", "c_cyan_yellow", color_pair( 55 ), "def_c_brown_cyan" );
    add_color( "def_c_light_cyan_yellow", "c_light_cyan_yellow", color_pair( 55 ).bold(),
               "def_c_yellow_cyan" );

    add_color( "def_c_black_magenta", "c_black_magenta", color_pair( 56 ), "def_c_magenta" );
    add_color( "def_c_dark_gray_magenta", "c_dark_gray_magenta", color_pair( 56 ).bold(), "def_c_pink" );
    add_color( "def_c_light_gray_magenta", "c_light_gray_magenta", color_pair( 57 ),
               "def_c_magenta_white" );
    add_color( "def_c_white_magenta", "c_white_magenta", color_pair( 57 ).bold(), "def_c_pink_white" );
    add_color( "def_c_red_magenta", "c_red_magenta", color_pair( 58 ), "def_c_magenta_red" );
    add_color( "def_c_light_red_magenta", "c_light_red_magenta", color_pair( 58 ).bold(),
               "def_c_pink_red" );
    add_color( "def_c_green_magenta", "c_green_magenta", color_pair( 59 ), "def_c_magenta_green" );
    add_color( "def_c_light_green_magenta", "c_light_green_magenta", color_pair( 59 ).bold(),
               "def_c_pink_green" );
    add_color( "def_c_brown_magenta", "c_brown_magenta", color_pair( 60 ), "def_c_magenta_yellow" );
    add_color( "def_c_yellow_magenta", "c_yellow_magenta", color_pair( 60 ).bold(), "def_c_pink_yellow" );
    add_color( "def_c_blue_magenta", "c_blue_magenta", color_pair( 61 ), "def_h_magenta" );
    add_color( "def_c_light_blue_magenta", "c_light_blue_magenta", color_pair( 61 ).bold(), "def_h_pink" );
    add_color( "def_c_magenta_magenta", "c_magenta_magenta", color_pair( 62 ), "def_c_magenta_magenta" );
    add_color( "def_c_pink_magenta", "c_pink_magenta", color_pair( 62 ).bold(), "def_c_pink_magenta" );
    add_color( "def_c_cyan_magenta", "c_cyan_magenta", color_pair( 63 ), "def_c_magenta_cyan" );
    add_color( "def_c_light_cyan_magenta", "c_light_cyan_magenta", color_pair( 63 ).bold(),
               "def_c_pink_cyan" );

    add_color( "def_c_black_cyan", "c_black_cyan", color_pair( 64 ), "def_c_cyan" );
    add_color( "def_c_dark_gray_cyan", "c_dark_gray_cyan", color_pair( 64 ).bold(), "def_c_light_cyan" );
    add_color( "def_c_light_gray_cyan", "c_light_gray_cyan", color_pair( 65 ), "def_c_cyan_white" );
    add_color( "def_c_white_cyan", "c_white_cyan", color_pair( 65 ).bold(), "def_c_light_cyan_white" );
    add_color( "def_c_red_cyan", "c_red_cyan", color_pair( 66 ), "def_c_cyan_red" );
    add_color( "def_c_light_red_cyan", "c_light_red_cyan", color_pair( 66 ).bold(),
               "def_c_light_cyan_red" );
    add_color( "def_c_green_cyan", "c_green_cyan", color_pair( 67 ), "def_c_cyan_green" );
    add_color( "def_c_light_green_cyan", "c_light_green_cyan", color_pair( 67 ).bold(),
               "def_c_light_cyan_green" );
    add_color( "def_c_brown_cyan", "c_brown_cyan", color_pair( 68 ), "def_c_cyan_yellow" );
    add_color( "def_c_yellow_cyan", "c_yellow_cyan", color_pair( 68 ).bold(), "def_c_light_cyan_yellow" );
    add_color( "def_c_blue_cyan", "c_blue_cyan", color_pair( 69 ), "def_h_cyan" );
    add_color( "def_c_light_blue_cyan", "c_light_blue_cyan", color_pair( 69 ).bold(), "def_h_light_cyan" );
    add_color( "def_c_magenta_cyan", "c_magenta_cyan", color_pair( 70 ), "def_c_cyan_magenta" );
    add_color( "def_c_pink_cyan", "c_pink_cyan", color_pair( 70 ).bold(), "def_c_light_cyan_magenta" );
    add_color( "def_c_cyan_cyan", "c_cyan_cyan", color_pair( 71 ), "def_c_cyan_cyan" );
    add_color( "def_c_light_cyan_cyan", "c_light_cyan_cyan", color_pair( 71 ).bold(),
               "def_c_light_cyan_cyan" );

colors =
  {
    "black": [ 0, 0, 0 ],
    "red": [ 255, 0, 0 ],
    "green": [ 0, 110, 0 ],
    "brown": [ 97, 56, 28 ],
    "blue": [ 10, 10, 220 ],
    "magenta": [ 139, 58, 98 ],
    "cyan": [ 0, 150, 180 ],
    "gray": [ 150, 150, 150 ],

    "dark_gray": [ 99, 99, 99 ],
    "light_red": [ 255, 150, 150 ],
    "light_green": [ 0, 255, 0 ],
    "yellow": [ 255, 255, 0 ],
    "light_blue": [ 100, 100, 255 ],
    "light_magenta": [ 254, 0, 254 ],
    "light_cyan": [ 0, 240, 255 ],
    "white": [ 255, 255, 255 ]
  }
colors_by_num = Object.keys(colors)

console.log(`:root {`)
for (const color in colors) {
  console.log(`  --cata-color-${color}: rgb(${colors[color].join(',')});`)
}
console.log(`}`)

for (const c in all_colors) {
  let {fg, bg} = all_colors[c]
  fg = colors_by_num[fg]
  bg = colors_by_num[bg]
  const className = c.startsWith('c_') ? c : 'c_' + c
  console.log(`.${className} { color: var(--cata-color-${fg}); background: var(--cata-color-${bg}); }`);
}
