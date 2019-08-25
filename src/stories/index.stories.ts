import { storiesOf } from '@storybook/angular';
import { withKnobs } from '@storybook/addon-knobs';

import { Welcome } from '@storybook/angular/demo';
 
const stories = storiesOf('BI:Radix UI', module);
stories.addDecorator(withKnobs);
 
stories.add('Welcome', () => ({
   component: Welcome,
   props: {
   }
 }));