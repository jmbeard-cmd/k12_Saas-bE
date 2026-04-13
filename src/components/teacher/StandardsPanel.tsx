import { useState } from 'react';
import {
  GraduationCap, Briefcase, ChevronDown, ChevronRight,
  Check, Search, Info, Tag, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  CTE_CLUSTERS, CC_DOMAINS,
  type CTECluster, type CTEPathway, type CTEStandard,
  type CCDomain, type CCStandard
} from '@/lib/okStandards';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StandardsPanelProps {
  selectedStandards: string[];
  onChangeStandards: (standards: string[]) => void;
  selectedCteIds: string[];
  onChangeCteIds: (ids: string[]) => void;
  selectedCcIds: string[];
  onChangeCcIds: (ids: string[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StandardsPanel({
  selectedStandards,
  onChangeStandards,
  selectedCteIds,
  onChangeCteIds,
  selectedCcIds,
  onChangeCcIds,
}: StandardsPanelProps) {
  const [cteEnabled, setCteEnabled] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [expandedPathways, setExpandedPathways] = useState<Set<string>>(new Set());
  const [expandedCCDomains, setExpandedCCDomains] = useState<Set<string>>(new Set());

  // Toggle a code in a list
  const toggleCode = (code: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.includes(code) ? list.filter((c) => c !== code) : [...list, code]);
  };

  // When a standard code is toggled, also track it in selectedStandards
  const toggleStandard = (code: string) => {
    const next = selectedStandards.includes(code)
      ? selectedStandards.filter((c) => c !== code)
      : [...selectedStandards, code];
    onChangeStandards(next);
  };

  // CTE: toggling cluster id
  const toggleCte = (clusterId: string) => toggleCode(clusterId, selectedCteIds, onChangeCteIds);
  // CC: toggling domain id
  const toggleCc = (domainId: string) => toggleCode(domainId, selectedCcIds, onChangeCcIds);

  const toggleExpandCluster = (id: string) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpandPathway = (id: string) => {
    setExpandedPathways((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpandCCDomain = (id: string) => {
    setExpandedCCDomains((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Filter standards by search
  const matchesSearch = (text: string) =>
    !search.trim() || text.toLowerCase().includes(search.toLowerCase());

  const totalSelected = selectedStandards.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Standards Alignment
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selected standards are embedded as Nostr event tags
          </p>
        </div>
        {totalSelected > 0 && (
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground gap-1">
              <Check className="h-3 w-3" />
              {totalSelected} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => { onChangeStandards([]); onChangeCteIds([]); onChangeCcIds([]); }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Selected Standards Summary */}
      {totalSelected > 0 && (
        <Card className="border-primary/30 bg-primary/3">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              Embedded in next lesson plan / assignment event:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedStandards.map((code) => (
                <Badge
                  key={code}
                  variant="secondary"
                  className="text-[10px] cursor-pointer hover:bg-destructive/10 gap-1"
                  onClick={() => toggleStandard(code)}
                >
                  {code}
                  <X className="h-2.5 w-2.5" />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search standards by code or description…"
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Oklahoma CTE Toggle */}
      <Card className={cn('transition-all', cteEnabled && 'border-blue-300 dark:border-blue-800')}>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg transition-colors', cteEnabled ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted')}>
                <Briefcase className={cn('h-4 w-4', cteEnabled ? 'text-blue-600' : 'text-muted-foreground')} />
              </div>
              <div>
                <p className="font-semibold text-sm">Oklahoma CTE Standards</p>
                <p className="text-xs text-muted-foreground">CareerTech — 6 Career Clusters</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Oklahoma CTE standards from okcareertech.org. These are embedded as ok-cte-cluster tags in published Nostr events.
                </TooltipContent>
              </Tooltip>
              <Switch
                checked={cteEnabled}
                onCheckedChange={setCteEnabled}
                id="cte-toggle"
              />
            </div>
          </div>
        </CardHeader>

        {cteEnabled && (
          <CardContent className="pt-0 pb-3 px-4">
            <ScrollArea className="h-64 pr-3">
              <div className="space-y-1">
                {CTE_CLUSTERS.map((cluster) => {
                  const clusterSelected = selectedCteIds.includes(cluster.id);
                  const expanded = expandedClusters.has(cluster.id);

                  if (!matchesSearch(cluster.title) &&
                      !cluster.pathways.some((p) =>
                        matchesSearch(p.title) ||
                        p.standards.some((s) => matchesSearch(s.description) || matchesSearch(s.code))
                      )) return null;

                  return (
                    <div key={cluster.id}>
                      <button
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition-colors',
                          clusterSelected ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-muted'
                        )}
                        onClick={() => toggleExpandCluster(cluster.id)}
                      >
                        {expanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="font-medium flex-1 truncate">{cluster.title}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{cluster.code}</Badge>
                        <div
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                            clusterSelected ? 'bg-blue-600 border-blue-600' : 'border-border hover:border-blue-400'
                          )}
                          onClick={(e) => { e.stopPropagation(); toggleCte(cluster.id); }}
                        >
                          {clusterSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </button>

                      {expanded && (
                        <div className="ml-5 space-y-1 mt-1">
                          {cluster.pathways.map((pathway) => {
                            const pathExpanded = expandedPathways.has(pathway.id);

                            if (!matchesSearch(pathway.title) &&
                                !pathway.standards.some((s) => matchesSearch(s.description) || matchesSearch(s.code))) return null;

                            return (
                              <div key={pathway.id}>
                                <button
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs hover:bg-muted transition-colors"
                                  onClick={() => toggleExpandPathway(pathway.id)}
                                >
                                  {pathExpanded ? (
                                    <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className="flex-1 truncate font-medium">{pathway.title}</span>
                                  <Badge variant="outline" className="text-[9px]">{pathway.code}</Badge>
                                </button>

                                {pathExpanded && (
                                  <div className="ml-5 space-y-1">
                                    {pathway.standards.map((std) => {
                                      if (!matchesSearch(std.description) && !matchesSearch(std.code)) return null;
                                      const isSelected = selectedStandards.includes(std.code);
                                      return (
                                        <button
                                          key={std.id}
                                          className={cn(
                                            'w-full flex items-start gap-2 px-2 py-2 rounded-lg text-left text-xs transition-colors',
                                            isSelected ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800' : 'hover:bg-muted'
                                          )}
                                          onClick={() => toggleStandard(std.code)}
                                        >
                                          <div className={cn(
                                            'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5',
                                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-border'
                                          )}>
                                            {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                          </div>
                                          <div>
                                            <code className="font-mono text-[10px] text-blue-600 font-bold">{std.code}</code>
                                            <p className="mt-0.5 text-muted-foreground leading-snug">{std.description}</p>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>

      {/* Common Core Toggle */}
      <Card className={cn('transition-all', ccEnabled && 'border-green-300 dark:border-green-800')}>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg transition-colors', ccEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted')}>
                <GraduationCap className={cn('h-4 w-4', ccEnabled ? 'text-green-600' : 'text-muted-foreground')} />
              </div>
              <div>
                <p className="font-semibold text-sm">Common Core State Standards</p>
                <p className="text-xs text-muted-foreground">ELA & Math — Grades K-12</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  Common Core standards from corestandards.org. Embedded as ok-cc-domain tags in Nostr events for queryability.
                </TooltipContent>
              </Tooltip>
              <Switch
                checked={ccEnabled}
                onCheckedChange={setCcEnabled}
                id="cc-toggle"
              />
            </div>
          </div>
        </CardHeader>

        {ccEnabled && (
          <CardContent className="pt-0 pb-3 px-4">
            <ScrollArea className="h-64 pr-3">
              <div className="space-y-1">
                {CC_DOMAINS.map((domain) => {
                  const domainSelected = selectedCcIds.includes(domain.id);
                  const expanded = expandedCCDomains.has(domain.id);

                  if (!matchesSearch(domain.title) &&
                      !domain.standards.some((s) => matchesSearch(s.description) || matchesSearch(s.code))) return null;

                  return (
                    <div key={domain.id}>
                      <button
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm transition-colors',
                          domainSelected ? 'bg-green-50 dark:bg-green-950/30' : 'hover:bg-muted'
                        )}
                        onClick={() => toggleExpandCCDomain(domain.id)}
                      >
                        {expanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate block">{domain.title}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {domain.subject} • Grades {domain.gradeRange}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-medium flex-shrink-0', domain.subject === 'ELA' ? 'border-green-300 text-green-700' : 'border-blue-300 text-blue-700')}
                        >
                          {domain.subject}
                        </Badge>
                        <div
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                            domainSelected ? 'bg-green-600 border-green-600' : 'border-border hover:border-green-400'
                          )}
                          onClick={(e) => { e.stopPropagation(); toggleCc(domain.id); }}
                        >
                          {domainSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </button>

                      {expanded && (
                        <div className="ml-5 space-y-1 mt-1">
                          {domain.standards.map((std) => {
                            if (!matchesSearch(std.description) && !matchesSearch(std.code)) return null;
                            const isSelected = selectedStandards.includes(std.code);
                            return (
                              <button
                                key={std.id}
                                className={cn(
                                  'w-full flex items-start gap-2 px-2 py-2 rounded-lg text-left text-xs transition-colors',
                                  isSelected ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'hover:bg-muted'
                                )}
                                onClick={() => toggleStandard(std.code)}
                              >
                                <div className={cn(
                                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5',
                                  isSelected ? 'bg-green-600 border-green-600' : 'border-border'
                                )}>
                                  {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                </div>
                                <div>
                                  <code className="font-mono text-[10px] text-green-700 font-bold">{std.code}</code>
                                  <span className="ml-2 text-[10px] text-muted-foreground">Grade {std.grade}</span>
                                  <p className="mt-0.5 text-muted-foreground leading-snug">{std.description}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>

      {!cteEnabled && !ccEnabled && (
        <p className="text-xs text-center text-muted-foreground py-2">
          Enable a standards framework above to browse and select aligned standards.
        </p>
      )}
    </div>
  );
}
