'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui';
import { Plus } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import PerformanceForm from './PerformanceForm';

type Props = {
  action: (prevState: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
  showBasePrice: string;
};

export default function AddPerformanceSection({ action, showBasePrice }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-6">
      <CollapsibleTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          Nieuwe speeltijd toevoegen
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-4 p-6">
          <h2 className="text-xl font-semibold mb-4">Nieuwe speeltijd toevoegen</h2>
          <PerformanceForm
            action={action}
            showBasePrice={showBasePrice}
            onCancel={() => setOpen(false)}
          />
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
