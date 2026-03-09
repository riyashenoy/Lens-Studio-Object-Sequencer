/*
 * ObjectSequencer.ts
 * This script sequences SceneObjects appearing and disappearing with timers
 */

@component
export class ObjectSequencer extends BaseScriptComponent {

  // sequence starts right when the lens launches
  @input
  startAutomatically: boolean = true;

  // count to loop over the sequence
  @input
  loopCount: number = 1;

  // SceneObjects show or hide in the order set in editor
  // children objects will be affected too
  @input
  objects: SceneObject[] = [];

  // type exactly "show" or "hide" in editor for each object
  @input
  actions: string[] = [];

  // how many seconds to wait before each step fires
  // step 0 delay -> from when the sequence starts
  // each following delay is from when the previous step fired
  @input
  delays: number[] = [];

  private currentStep: number = 0;
  private currentLoop: number = 0;
  private isPlaying: boolean = false;

  onAwake() {

    // starts after all objects in the scene are fully initialized
    const startEvent = this.createEvent('OnStartEvent');
    startEvent.bind(() => {
      if (this.startAutomatically) {
        this.play();
      }
    });
  }

  // starts the sequence manually
  // for hand gestures, button presses, etc.
  play() {
    this.currentStep = 0;
    this.currentLoop = 0;
    this.isPlaying = true;
    this.scheduleStep(0);
  }

  // stops sequence early
  stop() {
    this.isPlaying = false;
  }

  // schedules a single step using a timer, then calls itself for the next step
  // chains all steps together automatically
  private scheduleStep(index: number) {
    
    if (!this.isPlaying) return;

    // after going through all steps, check if we should loop or finish
    if (index >= this.objects.length) {
      this.currentLoop++;
      const shouldLoop = this.loopCount === 0 || this.currentLoop < this.loopCount;
      if (shouldLoop) {
        // for looping, repeat steps
        this.scheduleStep(0);
      } else {
        print('[ObjectSequencer] Sequence complete.');
        this.isPlaying = false;
      }
      return;
    }

    // grabs values for step
    const obj = this.objects[index];
    const action = this.actions[index] ?? 'show';       
    const delay = Math.max(0, this.delays[index] ?? 0); 

    // timer that takes in delay var, then fires the step
    const handle = this.createEvent('DelayedCallbackEvent') as DelayedCallbackEvent;
    handle.reset(delay);
    handle.bind(() => {
      if (!obj) {
        print(`[ObjectSequencer] Step ${index}: No object assigned — skipping.`);
      } else {
        const enabled = action === 'show';
        this.applyVisibility(obj, enabled);
        print(`[ObjectSequencer] Step ${index}: ${enabled ? 'Showed' : 'Hid'} "${obj.name}"`);
      }
      // pushes next step immediately after the prev
      this.scheduleStep(index + 1);
    });
  }

  // show or hide an object & its children
  // scale to work with meshes AND SIK UI panels
  private applyVisibility(obj: SceneObject, enabled: boolean) {
    // scale to 0 for hiding SIK panels
    // scale to 1 for making them visible
    const scale = enabled ? new vec3(1, 1, 1) : new vec3(0, 0, 0);
    obj.getTransform().setLocalScale(scale);

    // enabled = false hides meshes and objects
    obj.enabled = enabled;

    // recurse into children so that empty parent objects work correctly
    for (let i = 0; i < obj.getChildrenCount(); i++) {
      this.applyVisibility(obj.getChild(i), enabled);
    }
  }
}