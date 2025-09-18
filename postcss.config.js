import purgecss from '@fullhuman/postcss-purgecss';
import cssnano from 'cssnano';

const isProd = process.env.NODE_ENV === 'production';

const safelist = [/^ant-/, /^Mui/, /^rc-/];

export default {
  plugins: {
    ...(isProd
      ? {
          [purgecss]: purgecss({
            content: ['index.html', 'src/**/*.{js,jsx,ts,tsx,html}'],
            safelist,
          }),
          cssnano: cssnano({ preset: 'default' }),
        }
      : {}),
  },
};


