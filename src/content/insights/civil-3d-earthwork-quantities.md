---
title: Getting earthwork quantities you can stand behind
topic: Civil 3D
summary: >-
  Surface-to-surface volumes are only as good as the surfaces. Where Civil 3D
  quantity errors come from, how to check a number before it goes into a
  tender, and what the model does not account for.
published: 2026-04-15
readingTime: 7
image: ../../assets/images/mass-earthworks-overhead.jpg
imageAlt: Overhead view of excavators and haul trucks working across cut earth
---

Earthwork quantity is one of the few numbers on a civil drawing set that translates
directly into money. It goes into tenders, it sets budgets, and when it is wrong the
gap shows up as a claim.

Civil 3D computes it as a volume between two triangulated surfaces. The arithmetic is
reliable. The inputs are where the error lives.

## Where the error comes from

**The existing surface.** The TIN is interpolated between survey points. Sparse data
across complex terrain produces a surface that is smooth where the ground is not, and
the volume error follows the surface error across the whole area. Breaklines along
grade changes — tops and bottoms of banks, ditch centrelines, road crowns — do more
for accuracy than additional random points, because they force the triangulation to
follow the actual shape.

**Surface boundaries.** A surface extends to the extent of its data unless it is
bounded. An unbounded surface triangulates across areas with no survey coverage,
including across the concave parts of an irregular site boundary, and a volume
computed against it silently includes area that is not part of the project.

**Mismatched extents.** A volume surface is only meaningful where both surfaces
exist. If the design surface extends beyond the survey, the comparison in that region
is against interpolated nothing.

**Datum.** Two surfaces on different vertical datums produce a volume that is wrong
by the offset times the area. On a large site a small datum discrepancy is a very
large volume.

## The corrections the raw number does not include

A surface-to-surface volume is a bank volume — material in place, in the ground, as
it is now. Several adjustments sit between that and what gets hauled.

**Topsoil.** Strip depth over the whole stripped area is usually a separate quantity,
and it has to be removed from the cut before the structural earthwork balance is
computed, because stripped topsoil is generally stockpiled for reuse rather than
placed as structural fill.

**Shrink and swell.** Material compacted into a fill occupies a different volume than
it did in the ground. The factor is material-dependent and comes from the
geotechnical report. Cut and fill quantities compared without it are not comparable
quantities.

**Unsuitable material.** Organic or otherwise unacceptable material in the cut cannot
be placed in structural fill. It becomes disposal volume, and its replacement becomes
import volume — a double hit that a raw cut/fill number does not show.

**Subgrade preparation and over-excavation.** Removing and replacing soft subgrade
under pavements and pads is additional excavation and additional fill that does not
appear in a comparison of existing ground to finished grade, because it happens below
the design surface.

**Structural excavation.** Foundations, pipe trenches and pond excavation may or may
not be inside the mass earthwork quantity depending on how the surfaces were built.
Whether they are included needs to be stated, not assumed.

## Checking a number before it ships

A few checks catch most errors:

- **Look at the volume surface.** Rendered as an elevation analysis, cut and fill
  regions are immediately visible. Anything unexpected — depth at the site boundary,
  volume outside the work area, a sharp discontinuity — is usually an input error.
- **Test the sensitivity.** Move the design surface up and down by a small amount and
  see how the quantity responds. It tells you how tight the balance is and how much
  of the result rests on an assumption.
- **Cross-check by a second method.** Compare the surface-to-surface result against a
  cross-sectional (average end area) calculation. Large disagreement means one of the
  surfaces is not what you think it is.
- **Confirm the boundaries.** Check that both surfaces are bounded to the same limit
  and that the limit is the actual work area.
- **State the basis.** Whatever assumptions the number carries — strip depth,
  shrinkage factor, what is included and excluded, what datum — should be written
  next to it. A quantity without its basis is not a quantity anyone can rely on.

## Model-based delivery

Where the design model is issued to the contractor for machine control rather than
only as paper drawings, the surface becomes a construction document. That raises the
standard: it needs to be clean, correctly bounded, on the right datum, and consistent
with the drawings it accompanies, because the grader will build what the surface
says.

It also makes the quantity conversation easier, because both parties are working from
the same geometry rather than from two independent interpretations of a drawing.
