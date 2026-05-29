export function FormHero() {
  return (
    <div className="form-hero">
      <div className="form-hero__content">
        <h2 className="form-hero__title">Кредитка на всі твої бажалки</h2>

        <div className="form-hero__badges">
          <span className="form-hero__badge">ліміт до 200 000 грн</span>
          <span className="form-hero__badge">до 62 днів без переплат</span>
        </div>
      </div>

      <div className="form-hero__image-wrap">
        <img src={`${import.meta.env.VITE_ASSETS_BASE_URL}/form-hero.png`} alt="картка" className="form-hero__image" />
      </div>
    </div>
  );
}
