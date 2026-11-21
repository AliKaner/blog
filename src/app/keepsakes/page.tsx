import { PetCabinet } from "@/components/pets/PetCabinet";
import { PetCreatorSection } from "@/components/pets/PetCreatorSection";

export default function KeepsakesPage() {
  return (
    <div className="relative">
      <h1 className="font-heading text-3xl text-ink">Keepsakes</h1>
      <PetCreatorSection />
      <div className="mt-8">
        <PetCabinet />
      </div>
    </div>
  );
}
