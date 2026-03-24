"use client";

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, Users } from 'lucide-react';

interface CourseCardProps {
  title: string;
  instructor: string;
  thumbnail: string;
  rating: number;
  students: number;
  duration: string;
  category: string;
}

const CourseCard = ({ title, instructor, thumbnail, rating, students, duration, category }: CourseCardProps) => {
  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-white dark:bg-slate-900">
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={thumbnail} 
          alt={title} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm">
          {category}
        </Badge>
      </div>
      <CardHeader className="p-4 pb-2">
        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{instructor}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-foreground">{rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{students}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full rounded-full font-semibold">
          Ver Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;