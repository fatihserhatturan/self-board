"use client";

import {
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bookmark,
  ChevronDown,
  Copy,
  Mail,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Divider } from "@/components/ui/divider";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PriorityIcon } from "@/components/ui/priority-icon";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusIcon } from "@/components/ui/status-icon";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip } from "@/components/ui/tooltip";
import {
  badgeColors,
  decorationColors,
  greyScale,
  priorityLabels,
  priorityLevels,
  primaryScale,
  semanticUiColors,
  shadowScale,
  statusLabels,
  statusStates,
  typographyScale,
} from "@/lib/token-manifest";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-border-default pb-10">
      <h2 className="text-title3 font-medium text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ name, hex }: { name: string; hex: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-14 w-full rounded-md border border-border-default"
        style={{ background: hex }}
      />
      <span className="text-mini text-text-secondary">{name}</span>
      <span className="text-micro text-text-tertiary">{hex}</span>
    </div>
  );
}

const ASSIGNEES: ComboboxOption[] = [
  { value: "fatih", label: "Fatih Turan" },
  { value: "ada", label: "Ada Lovelace" },
  { value: "grace", label: "Grace Hopper" },
  { value: "alan", label: "Alan Turing" },
  { value: "linus", label: "Linus Torvalds" },
];

export default function DesignSystemPage() {
  const [checked, setChecked] = useState<boolean | "indeterminate">("indeterminate");
  const [showNotifications, setShowNotifications] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  const [assignee, setAssignee] = useState<string>();
  const [dueDate, setDueDate] = useState<Date>();
  const [starred, setStarred] = useState(true);
  const [alignment, setAlignment] = useState("left");
  const [switchOn, setSwitchOn] = useState(true);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-14">
      <div>
        <h1 className="text-title1 font-medium text-text-primary">Tasarım Sistemi</h1>
        <p className="mt-2 text-normal text-text-secondary">
          Linear&apos;ın gerçek design token export&apos;undan türetilen renk, tipografi, efekt
          ve component çekirdeği.
        </p>
      </div>

      <Section title="Renkler — Grey Scale">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {greyScale.map((c) => (
            <Swatch key={c.cssVar} name={c.name} hex={c.hex} />
          ))}
        </div>
      </Section>

      <Section title="Renkler — Primary / Brand">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {primaryScale.map((c) => (
            <Swatch key={c.cssVar} name={c.name} hex={c.hex} />
          ))}
        </div>
      </Section>

      <Section title="Renkler — Semantik UI Tokenleri">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {semanticUiColors.map((c) => (
            <Swatch key={c.cssVar} name={c.name} hex={c.hex} />
          ))}
        </div>
      </Section>

      <Section title="Renkler — Decoration / Label">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {decorationColors.map((c) => (
            <Swatch key={c.cssVar} name={c.name} hex={c.hex} />
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-mini text-text-tertiary">
          <AlertTriangle className="size-3.5" />
          TODO: yellow / mustard beyaz zeminde kontrast kontrolünden geçirilecek.
        </p>
      </Section>

      <Section title="Tipografi Skalası">
        <div className="flex flex-col gap-3">
          {typographyScale.map((t) => (
            <div key={t.name} className="flex items-baseline gap-4">
              <span className="w-28 shrink-0 text-mini text-text-tertiary">
                {t.name} · {t.fontSize}/{t.lineHeight}
              </span>
              <span className={`${t.className} text-text-primary`}>Self-Board Issues</span>
              <span className={`${t.className} font-medium text-text-primary`}>Self-Board Issues</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Gölge / Efekt Tokenleri">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {shadowScale.map((s) => (
            <div key={s.name} className="flex flex-col items-center gap-2">
              <div
                className={`flex h-16 w-full items-center justify-center rounded-lg bg-bg-surface ${s.className}`}
              >
                <span className="text-micro text-text-tertiary">{s.name}</span>
              </div>
              <span className="text-micro text-text-tertiary">{s.description}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Gradient">
        <div className="h-20 w-full rounded-lg bg-scrim" />
      </Section>

      <Section title="Button">
        <div className="flex flex-col gap-4">
          {(["primary", "secondary", "ghost", "destructive"] as const).map((variant) => (
            <div key={variant} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-mini text-text-tertiary">{variant}</span>
              <Button variant={variant} size="sm">
                Small
              </Button>
              <Button variant={variant} size="md">
                Medium
              </Button>
              <Button variant={variant} size="lg">
                Large
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-mini text-text-tertiary">state</span>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-mini text-text-tertiary">icon</span>
            <Button variant="primary" size="icon" aria-label="Düzenle">
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="secondary" size="icon" aria-label="Düzenle">
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Düzenle">
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="destructive" size="icon" aria-label="Sil">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Input">
        <div className="grid max-w-md gap-3">
          <Input placeholder="Varsayılan" />
          <Input placeholder="İkonlu arama" leadingIcon={<Search />} />
          <Input placeholder="Geçersiz" invalid trailingIcon={<AlertTriangle />} />
          <Input placeholder="Devre dışı" disabled />
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap gap-2">
          {badgeColors.map((color) => (
            <Badge key={color} color={color} withDot>
              {color}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {badgeColors.map((color) => (
            <Badge key={color} color={color} size="sm">
              {color}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Avatar">
        <div className="flex items-center gap-3">
          <Avatar name="Fatih Turan" size="sm" />
          <Avatar name="Fatih Turan" size="md" />
          <Avatar name="Fatih Turan" size="lg" />
          <Avatar name="Ada Lovelace" size="md" />
          <Avatar name="broken" size="md" src="https://invalid.example/broken.png" />
        </div>
      </Section>

      <Section title="Checkbox">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-small text-text-primary">
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => setChecked(v)}
            />
            {checked === "indeterminate" ? "Indeterminate" : checked ? "Checked" : "Unchecked"}
          </label>
          <Checkbox disabled />
          <Checkbox defaultChecked disabled />
        </div>
      </Section>

      <Section title="Divider">
        <div className="flex flex-col gap-4">
          <Divider />
          <div className="flex h-8 items-center gap-4">
            <span className="text-small text-text-secondary">Sol</span>
            <Divider orientation="vertical" />
            <span className="text-small text-text-secondary">Sağ</span>
          </div>
        </div>
      </Section>

      <Section title="Tooltip">
        <Tooltip content="Bu bir tooltip içeriği">
          <Button variant="secondary">Üzerine gel</Button>
        </Tooltip>
      </Section>

      <Section title="Dropdown Menu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              Menü <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>
              <Mail className="size-3.5" /> Profili düzenle
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem
              checked={showNotifications}
              onCheckedChange={setShowNotifications}
            >
              Bildirimler
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Hesabı sil</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section title="Dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Dialog aç</Button>
          </DialogTrigger>
          <DialogContent size="sm">
            <DialogTitle>Issue&apos;yu sil</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Issue kalıcı olarak silinecek.
            </DialogDescription>
            <div className="mt-6 flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="secondary">Vazgeç</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive">Sil</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Select">
        <Select defaultValue="in-progress">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="todo">Todo</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      <Section title="Textarea">
        <div className="grid max-w-md gap-3">
          <Textarea placeholder="Açıklama yaz..." />
          <Textarea placeholder="Geçersiz" invalid />
          <Textarea placeholder="Devre dışı" disabled />
        </div>
      </Section>

      <Section title="Label & Switch">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Switch id="notify" checked={switchOn} onCheckedChange={setSwitchOn} />
            <Label htmlFor="notify">E-posta bildirimleri {switchOn ? "açık" : "kapalı"}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch disabled />
            <Label className="opacity-50">Devre dışı</Label>
          </div>
        </div>
      </Section>

      <Section title="Radio Group">
        <RadioGroup defaultValue="board" className="flex flex-col gap-2">
          {[
            { value: "list", label: "List görünümü" },
            { value: "board", label: "Board görünümü" },
            { value: "timeline", label: "Timeline görünümü" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-small text-text-primary">
              <RadioGroupItem value={option.value} />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="text-small text-text-secondary">
            Liste görünümü içeriği.
          </TabsContent>
          <TabsContent value="board" className="text-small text-text-secondary">
            Board görünümü içeriği.
          </TabsContent>
          <TabsContent value="timeline" className="text-small text-text-secondary">
            Timeline görünümü içeriği.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Popover">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">Popover aç</Button>
          </PopoverTrigger>
          <PopoverContent>
            <p className="text-small font-medium text-text-primary">Hızlı not</p>
            <p className="mt-1 text-mini text-text-secondary">
              Popover, dropdown menüden farklı olarak serbest içerik barındırır.
            </p>
          </PopoverContent>
        </Popover>
      </Section>

      <Section title="Context Menu">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-border-default text-small text-text-tertiary">
              Sağ tıkla
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              <Pencil className="size-3.5" /> Düzenle
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy className="size-3.5" /> Kopyala
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              <Trash2 className="size-3.5" /> Sil
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Section>

      <Section title="Command Palette">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setCommandOpen(true)}>
            Komut paletini aç
          </Button>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <Command>
            <CommandInput placeholder="Bir komut ara..." />
            <CommandList>
              <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
              <CommandGroup>
                <CommandItem>Yeni issue oluştur</CommandItem>
                <CommandItem>Yeni proje oluştur</CommandItem>
                <CommandItem>Ayarlara git</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      </Section>

      <Section title="Toast">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => toast.success("Issue oluşturuldu")}>
            Success
          </Button>
          <Button variant="secondary" onClick={() => toast.error("Bir şeyler ters gitti")}>
            Error
          </Button>
          <Button variant="secondary" onClick={() => toast.warning("Kaydedilmemiş değişiklikler var")}>
            Warning
          </Button>
        </div>
      </Section>

      <Section title="Alert">
        <div className="flex flex-col gap-3">
          <Alert variant="info" title="Bilgi">
            Bu bir bilgilendirme mesajıdır.
          </Alert>
          <Alert variant="success" title="Başarılı">
            İşlem başarıyla tamamlandı.
          </Alert>
          <Alert variant="warning" title="Uyarı">
            Bu işlem geri alınamayabilir.
          </Alert>
          <Alert variant="destructive" title="Hata">
            İşlem gerçekleştirilemedi.
          </Alert>
        </div>
      </Section>

      <Section title="Progress & Skeleton">
        <div className="flex flex-col gap-4">
          <Progress value={60} />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </Section>

      <Section title="Collapsible">
        <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronDown
                className={`size-3.5 transition-transform ${collapsibleOpen ? "rotate-180" : ""}`}
              />
              Alt issue&apos;lar (3)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1.5 pl-6 pt-2">
            <span className="text-small text-text-secondary">SB-101 · Login formu</span>
            <span className="text-small text-text-secondary">SB-102 · Şifre sıfırlama</span>
            <span className="text-small text-text-secondary">SB-103 · Oturum yönetimi</span>
          </CollapsibleContent>
        </Collapsible>
      </Section>

      <Section title="Scroll Area">
        <ScrollArea className="h-40 w-full max-w-sm rounded-lg border border-border-default">
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 20 }, (_, i) => (
              <span key={i} className="text-small text-text-secondary">
                Satır {i + 1}
              </span>
            ))}
          </div>
        </ScrollArea>
      </Section>

      <Section title="Priority & Status İkonları">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            {priorityLevels.map((level) => (
              <div key={level} className="flex items-center gap-1.5">
                <PriorityIcon level={level} />
                <span className="text-small text-text-secondary">{priorityLabels[level]}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {statusStates.map((state) => (
              <div key={state} className="flex items-center gap-1.5">
                <StatusIcon state={state} />
                <span className="text-small text-text-secondary">{statusLabels[state]}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-mini text-text-tertiary">
          <AlertTriangle className="size-3.5" />
          Yaklaşıklama: Figma token export&apos;unda ikon asset&apos;i yoktu, bunlar lucide-react
          ile en yakın karşılıklar — Linear&apos;ın gerçek özel ikonları değil.
        </p>
      </Section>

      <Section title="Combobox">
        <Combobox
          options={ASSIGNEES}
          value={assignee}
          onValueChange={setAssignee}
          placeholder="Kişi ata"
          searchPlaceholder="Kişi ara..."
        />
      </Section>

      <Section title="Date Picker">
        <div className="flex flex-col gap-2">
          <DatePicker value={dueDate} onValueChange={setDueDate} placeholder="Bitiş tarihi seç" />
          <span className="text-mini text-text-tertiary">
            {dueDate ? `Seçilen tarih: ${dueDate.toLocaleDateString("tr-TR")}` : "Tarih seçilmedi"}
          </span>
        </div>
      </Section>

      <Section title="Hover Card">
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className="inline-flex w-fit cursor-pointer">
              <Avatar name="Fatih Turan" size="md" />
            </span>
          </HoverCardTrigger>
          <HoverCardContent>
            <p className="text-small font-medium text-text-primary">Fatih Turan</p>
            <p className="mt-1 text-mini text-text-tertiary">Kurucu · turan.fatih@dgpaysit.com</p>
          </HoverCardContent>
        </HoverCard>
      </Section>

      <Section title="Toggle">
        <div className="flex items-center gap-3">
          <Toggle pressed={starred} onPressedChange={setStarred} aria-label="Yıldızla">
            <Bookmark className={`size-3.5 ${starred ? "fill-current" : ""}`} />
          </Toggle>
          <Toggle disabled aria-label="Devre dışı">
            <Bookmark className="size-3.5" />
          </Toggle>
        </div>
      </Section>

      <Section title="Toggle Group">
        <ToggleGroup
          type="single"
          value={alignment}
          onValueChange={(v) => v && setAlignment(v)}
        >
          <ToggleGroupItem value="left" aria-label="Sola hizala">
            <AlignLeft className="size-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Ortala">
            <AlignCenter className="size-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Sağa hizala">
            <AlignRight className="size-3.5" />
          </ToggleGroupItem>
        </ToggleGroup>
      </Section>
    </div>
  );
}
