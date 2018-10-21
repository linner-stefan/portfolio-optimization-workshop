import { SpaFrontendPage } from './app.po';

describe('spa-frontend App', () => {
  let page: SpaFrontendPage;

  beforeEach(() => {
    page = new SpaFrontendPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
