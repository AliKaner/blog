import { PetYard } from "@/components/pets/PetYard";
import { PetCreatorSection } from "@/components/pets/PetCreatorSection";

export default function PetsPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Pet Corner</h1>
      <div className="mt-8">
        <PetYard />
      </div>
      <PetCreatorSection />
    </div>
  );
}
