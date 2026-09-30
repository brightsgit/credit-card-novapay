export function FormHero() {
  return (
    <div className="form-hero">
      <div className="form-hero__content">
        <h2 className="form-hero__title">Відкрий Кредитку</h2>

        <div className="form-hero__badges">
          <span className="form-hero__badge">Повертай свої <br/>витрати</span>
        </div>
      </div>

      <div className="form-hero__image-wrap">
        <img src={`${import.meta.env.VITE_ASSETS_BASE_URL}/form-hero.png`} alt="картка" className="form-hero__image form-hero__image--desktop" />
        <img src={`${import.meta.env.VITE_ASSETS_BASE_URL}/form-hero-m.png`} alt="картка" className="form-hero__image form-hero__image--mobile" />
      </div>
    </div>
  );
}
