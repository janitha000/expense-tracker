"use client";

import React from "react";
import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

interface DynamicIconProps extends LucideProps {
  name: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  // Try exact match or match from Lucide exports
  const IconComponent = (Icons as unknown as Record<string, React.FC<LucideProps>>)[name] || Icons.CreditCard;
  return <IconComponent {...props} />;
};
