import {NgZone} from "@angular/core";
export class SliderDragUtil {

  public static sliderDrag(zone: NgZone, e: MouseEvent, getElementPosition: Function, getElementWidth: Function, slide: Function, after?: Function) {

    if (e.button != 0)
      return;

    e.preventDefault();
    e.stopPropagation();

    let dx = e.pageX -getElementPosition();

    let drag = (e: MouseEvent) => {

      e.preventDefault();
      e.stopPropagation();

      slide((e.pageX -dx) /getElementWidth());
    };

    let dragEnd = (e: MouseEvent) => {

      if (e.button != 0)
        return;

      e.preventDefault();
      e.stopPropagation();

      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', dragEnd);

      zone.run(() => {

        if (after)
            after();
      });
    };

    zone.runOutsideAngular(() => {

      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);
    });
  }
}

export class SliderDragBuilder {

  private zone: NgZone;
  private e: MouseEvent;
  private elementPosition: Function;
  private elementWidth: Function;
  private slide: Function;
  private after: Function;

  withZone(zone: NgZone) {

    this.zone = zone;
    return this;
  }

  withMouseEvenet(e: MouseEvent) {

    this.e = e;
    return this;
  }

  withElementPosition(elementPosition: Function) {

    this.elementPosition = elementPosition;
    return this;
  }

  withElementWidth(elementWidth: Function) {

    this.elementWidth = elementWidth;
    return this;
  }

  onSlide(slide: Function) {

    this.slide = slide;
    return this;
  }

  doAfter(after: Function) {

    this.after = after;
    return this;
  }

  construct() {

    SliderDragUtil.sliderDrag(

      this.zone,
      this.e,
      this.elementPosition,
      this.elementWidth,
      this.slide,
      this.after);
  }
}
