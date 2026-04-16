/*
 * ObjectSequencer.ts
 * This script sequences SceneObjects appearing and disappearing with timers
 */

@component
export class ObjectSequencer extends BaseScriptComponent {

  @input
  startAutomatically: boolean = true;

  @input
  loopCount: number = 1;

  @input
  objects: SceneObject[] = [];

  @input
  actions: string[] = [];

  @input
  delays: number[] = [];

  private currentStep: number = 0;
  private currentLoop: number = 0;
  private isPlaying: boolean = false;

  onAwake() {
    const startEvent = this.createEvent('OnStartEvent');
    startEvent.bind(() => {
      if (this.startAutomatically) {
        this.play();
      }
    });
  }

  play() {
    this.currentStep = 0;
    this.currentLoop = 0;
    this.isPlaying = true;
    this.scheduleStep(0);
  }

  stop() {
    this.isPlaying = false;
  }

  private scheduleStep(index: number) {
    if (!this.isPlaying) return;

    if (index >= this.objects.length) {
      this.currentLoop++;
      const shouldLoop = this.loopCount === 0 || this.currentLoop < this.loopCount;
      if (shouldLoop) {
        this.scheduleStep(0);
      } else {
        print('[ObjectSequencer] Sequence complete.');
        this.isPlaying = false;
      }
      return;
    }

    const obj = this.objects[index];
    const action = this.actions[index] ?? 'show';
    const delay = Math.max(0, this.delays[index] ?? 0);

    const handle = this.createEvent('DelayedCallbackEvent') as DelayedCallbackEvent;
    handle.reset(delay);
    handle.bind(() => {
      if (!obj) {
        print(`[ObjectSequencer] Step ${index}: No object assigned — skipping.`);
      } else {
        const enabled = action === 'show';
        obj.enabled = enabled;
        print(`[ObjectSequencer] Step ${index}: ${enabled ? 'Showed' : 'Hid'} "${obj.name}"`);
      }
      this.scheduleStep(index + 1);
    });
  }
}
