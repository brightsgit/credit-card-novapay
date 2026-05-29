import { FormHero } from "./form-hero.component";
import { Form } from "./form.component";

export function FormSection() {
  return (
    <section className="form-section">
      <FormHero />
      <Form />
    </section>
  );
}
