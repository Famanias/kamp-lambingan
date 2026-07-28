import {
  Snowflake,
  Droplet,
  Flame,
  Users,
  Mountain,
  Sparkles,
  Waves,
  Bath,
  Compass,
  Wind,
  Sun,
  Utensils,
  HelpCircle,
} from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export default function IconRenderer({ name, className = 'text-primary', size = 22 }: IconRendererProps) {
  const props = { className, size };

  switch (name) {
    case 'ac_unit':
      return <Snowflake {...props} />;
    case 'water_drop':
      return <Droplet {...props} />;
    case 'local_fire_department':
      return <Flame {...props} />;
    case 'diversity_1':
      return <Users {...props} />;
    case 'landscape':
      return <Mountain {...props} />;
    case 'star_border':
      return <Sparkles {...props} />;
    case 'pool':
      return <Waves {...props} />;
    case 'hot_tub':
      return <Bath {...props} />;
    case 'terrain':
      return <Compass {...props} />;
    case 'waves':
      return <Wind {...props} />;
    case 'deck':
      return <Sun {...props} />;
    case 'outdoor_grill':
      return <Utensils {...props} />;
    default:
      return <HelpCircle {...props} />;
  }
}
